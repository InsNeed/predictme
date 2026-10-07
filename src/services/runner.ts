import { plannedTasks, type Task } from '@/domain/plan';
import { costOf, estimate, maxTokensFor } from '@/domain/pricing';
import { buildSystem, buildUser, normalizeAnswer } from '@/domain/prompts';
import { makeRng } from '@/domain/rng';
import type { CallRecord, Run } from '@/domain/types';
import { ApiError, chat, parseJsonLoose } from './deepseek';
import { generateReport } from './report';
import { saveRun } from '@/storage/runs';

export interface RunnerEvents {
  onChange(): void;
  onLog(msg: string): void;
}

export class Runner {
  private queue: Task[] = [];
  private inflight = 0;
  private controller = new AbortController();
  private saveTimer: number | null = null;
  private stopped = false;
  lastError = '';
  reporting = false;
  reportDraft = '';
  reportThinking = 0;
  reportStarted = 0;
  private reportController = new AbortController();

  cancelReport() {
    this.reportController.abort();
  }

  constructor(public run: Run, private ev: RunnerEvents) {}

  get active() {
    return this.run.status === 'running';
  }

  start() {
    const done = this.run.calls;
    this.queue = plannedTasks(this.run).filter((t) => done[t.key]?.status !== 'ok');
    this.stopped = false;
    this.controller = new AbortController();
    this.run.status = 'running';
    this.ev.onChange();
    this.pump();
  }

  pause() {
    this.stopped = true;
    this.run.status = 'paused';
    this.controller.abort();
    this.persist(true);
    this.ev.onChange();
  }

  stop() {
    this.stopped = true;
    this.run.status = 'stopped';
    this.controller.abort();
    this.persist(true);
    this.ev.onChange();
  }

  private persist(now = false) {
    if (now) {
      if (this.saveTimer) window.clearTimeout(this.saveTimer);
      this.saveTimer = null;
      void saveRun(this.run);
      return;
    }
    if (this.saveTimer) return;
    this.saveTimer = window.setTimeout(() => {
      this.saveTimer = null;
      void saveRun(this.run);
    }, 1500);
  }

  private pump() {
    const cfg = this.run.config;
    const est = estimate(cfg.cost, cfg.variantB.enabled, cfg.aspects.length);
    const recs = Object.values(this.run.calls);
    const perCall = recs.length >= 3 ? recs.reduce((s, r) => s + r.cost, 0) / recs.length : est.perCall;
    while (!this.stopped && this.inflight < cfg.cost.concurrency && this.queue.length) {
      if (this.run.spent + perCall * (this.inflight + 1) > cfg.cost.budgetCNY) {
        this.stopped = true;
        this.run.status = 'budget';
        this.ev.onLog('已达到预算上限，停止发出新请求');
        this.persist(true);
        this.ev.onChange();
        return;
      }
      const t = this.queue.shift()!;
      this.inflight++;
      void this.exec(t).finally(() => {
        this.inflight--;
        this.ev.onChange();
        this.persist();
        if (!this.stopped && this.queue.length) this.pump();
        else if (this.inflight === 0 && !this.stopped && this.queue.length === 0) this.finish();
      });
    }
    if (this.inflight === 0 && this.queue.length === 0 && !this.stopped) this.finish();
  }

  private async finish() {
    if (this.run.status !== 'running') return;
    this.run.status = 'done';
    this.persist(true);
    this.ev.onChange();
    if (this.run.config.cost.autoReport && !this.run.report) await this.report();
  }

  async report(filters: Parameters<typeof generateReport>[1] = null, scope = '全部人设') {
    this.reporting = true;
    this.reportDraft = '';
    this.reportThinking = 0;
    this.reportStarted = Date.now();
    this.lastError = '';
    this.reportController = new AbortController();
    this.ev.onChange();
    try {
      const r = await generateReport(this.run, filters, this.run.config.cost.reportModel, scope, (content, reasoning) => {
        this.reportDraft = content;
        this.reportThinking = reasoning.length;
        this.ev.onChange();
      }, this.reportController.signal);
      this.run.report = { markdown: r.markdown, at: Date.now(), cost: r.cost, scope };
      this.run.spent += r.cost;
    } catch (e) {
      this.lastError = (e as Error).name === 'AbortError' ? '报告已取消' : `报告生成失败：${(e as Error).message}`;
      this.ev.onLog(this.lastError);
    } finally {
      this.reporting = false;
      this.reportDraft = '';
      this.persist(true);
      this.ev.onChange();
    }
  }

  private async exec(t: Task) {
    const run = this.run;
    const cfg = run.config;
    const persona = run.personas.find((p) => p.id === t.personaId)!;
    let retestOf;
    if (t.kind === 'retest') {
      const main = run.calls[`${t.personaId}|A|main`];
      if (main?.status !== 'ok') return;
      retestOf = main.optionOrder;
    }
    const rng = makeRng(cfg.seed * 31 + persona.idx * 7 + (t.variant === 'B' ? 3 : 0) + (t.kind === 'retest' ? 11 : 0));
    const system = buildSystem(cfg, t.variant, persona.exposure);
    const user = buildUser(cfg, t.variant, persona, rng, retestOf);
    const started = performance.now();
    let attempt = 0;
    const usageSum = { hit: 0, miss: 0, out: 0, reasoning: 0 };
    let costSum = 0;
    while (attempt < 3) {
      attempt++;
      try {
        const res = await chat({
          model: cfg.cost.model,
          thinking: cfg.cost.thinking,
          temperature: cfg.cost.temperature,
          maxTokens: maxTokensFor(cfg.cost.detail, cfg.cost.thinking),
          json: true,
          signal: this.controller.signal,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user.text },
          ],
        });
        usageSum.hit += res.usage.hit;
        usageSum.miss += res.usage.miss;
        usageSum.out += res.usage.out;
        usageSum.reasoning += res.usage.reasoning;
        const c = costOf(cfg.cost.model, res.usage);
        costSum += c;
        run.spent += c;
        if (res.finish === 'length') throw new ApiError('回答被截断', 0, true);
        const parsed = parseJsonLoose(res.content);
        const answer = normalizeAnswer(parsed, user.order, cfg.aspects);
        const rec: CallRecord = {
          key: t.key, personaId: t.personaId, variant: t.variant, kind: t.kind, status: 'ok', answer,
          reasoning: res.reasoning || undefined, usage: usageSum, cost: costSum, ms: performance.now() - started, optionOrder: user.order, at: Date.now(),
        };
        run.calls[t.key] = rec;
        return;
      } catch (e) {
        if ((e as Error).name === 'AbortError') {
          this.queue.unshift(t);
          return;
        }
        const retryable = e instanceof ApiError ? e.retryable : true;
        const msg = (e as Error).message;
        if (e instanceof ApiError && (e.status === 401 || e.status === 402)) {
          this.lastError = msg;
          this.ev.onLog(msg);
          this.stopped = true;
          this.run.status = 'paused';
          this.queue.unshift(t);
          return;
        }
        if (!retryable || attempt >= 3) {
          run.calls[t.key] = {
            key: t.key, personaId: t.personaId, variant: t.variant, kind: t.kind, status: 'error', error: msg,
            usage: usageSum, cost: costSum, ms: performance.now() - started, optionOrder: user.order, at: Date.now(),
          };
          this.lastError = msg;
          return;
        }
        await new Promise((r) => setTimeout(r, 800 * attempt * attempt + Math.random() * 400));
      }
    }
  }
}

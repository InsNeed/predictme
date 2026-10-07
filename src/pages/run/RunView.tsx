import { useMemo, useState } from 'react';
import { FilterBar } from '@/components/FilterBar';
import { Seg } from '@/components/ui';
import { applyFilters, buildRows, emptyFilters, type Filters, type View } from '@/domain/aggregate';
import { go } from '@/app/router';
import { plannedTasks } from '@/domain/plan';
import { yuan } from '@/domain/pricing';
import { exportCsv, exportJson } from '@/services/export';
import { getRunner, peekRunner, useRun } from '@/state/runs';
import { saveDraft } from '@/storage/settings';
import { Overview } from './tabs/Overview';
import { Segments } from './tabs/Segments';
import { Aspects } from './tabs/Aspects';
import { Voices } from './tabs/Voices';
import { Robustness } from './tabs/Robustness';
import { Report } from './tabs/Report';
import { Setup } from './tabs/Setup';

const TABS = [
  { id: 'overview', l: '总览' },
  { id: 'segments', l: '分群对比' },
  { id: 'aspects', l: '各方面评价' },
  { id: 'voices', l: '逐人原话' },
  { id: 'report', l: 'AI 解读报告' },
  { id: 'robust', l: '稳健性检查' },
  { id: 'setup', l: '本次设定' },
];

const STATUS: Record<string, string> = { running: '运行中', paused: '已暂停', done: '已完成', stopped: '已停止', budget: '已达预算上限', draft: '准备中' };

export function RunView({ id }: { id: string }) {
  const { run, loading } = useRun(id);
  const [tab, setTab] = useState('overview');
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [view, setView] = useState<View>('A');

  const allRows = useMemo(() => (run ? buildRows(run) : []), [run, run && Object.keys(run.calls).length, run?.spent]);
  const rows = useMemo(() => applyFilters(allRows, filters, view), [allRows, filters, view]);

  if (loading) return <div className="empty"><span className="spin" /></div>;
  if (!run) return <div className="empty">找不到这次预测。<a href="#/history">返回记录</a></div>;

  const runner = peekRunner(run.id);
  const total = plannedTasks(run).length;
  const done = Object.values(run.calls).filter((c) => c.status === 'ok').length;
  const errors = Object.values(run.calls).filter((c) => c.status === 'error').length;
  const pct = total ? (done / total) * 100 : 0;
  const running = run.status === 'running';
  const b = run.config.variantB;

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="eyebrow">FORECAST · {new Date(run.createdAt).toLocaleString('zh-CN')}</div>
          <h1>{run.title}</h1>
          <div className="row mt8 small">
            <span className={`tag ${running ? 'red' : run.status === 'done' ? 'teal' : ''}`}>{running && <span className="spin" style={{ width: 9, height: 9, marginRight: 4, verticalAlign: -1 }} />}{STATUS[run.status]}</span>
            <span className="muted">已完成 <b className="num">{done}</b> / {total} 次调用{errors ? `，失败 ${errors}` : ''}</span>
            <span className="muted">已花费 <b className="num">{yuan(run.spent)}</b> / 上限 ¥{run.config.cost.budgetCNY}</span>
            {runner?.lastError && <span className="tag red" title={runner.lastError}>最近错误：{runner.lastError.slice(0, 40)}</span>}
          </div>
        </div>
        <div className="row">
          {running ? (
            <>
              <button className="btn" onClick={() => getRunner(run).pause()}>❙❙ 暂停</button>
              <button className="btn ghost" onClick={() => getRunner(run).stop()}>■ 停止</button>
            </>
          ) : done < total ? (
            <button className="btn primary" onClick={() => getRunner(run).start()}>▶ {done ? '继续' : '开始'}{errors ? '（含重试失败项）' : ''}</button>
          ) : null}
          {!running && run.status !== 'draft' && (
            <button className="btn ghost" onClick={() => {
              const raw = prompt('把预算上限调到（元）：', String(run.config.cost.budgetCNY));
              const v = raw ? parseFloat(raw) : NaN;
              if (Number.isFinite(v) && v > 0) { run.config.cost.budgetCNY = v; getRunner(run).start(); }
            }}>调整预算</button>
          )}
          <button className="btn ghost" onClick={() => exportCsv(run, rows)}>导出 CSV</button>
          <button className="btn ghost" onClick={() => exportJson(run)}>导出 JSON</button>
          <button className="btn ghost" onClick={() => { saveDraft({ ...run.config, seed: Math.floor(Math.random() * 1e9) }); go('/new'); }}>复制设定</button>
        </div>
      </div>
      {(running || pct < 100) && (
        <div className={`progress ${running ? 'striped' : ''}`} style={{ marginBottom: 14 }}>
          <div style={{ width: `${pct}%` }} />
        </div>
      )}

      <FilterBar rows={allRows} filters={filters} setFilters={setFilters} view={view} shown={rows.filter((r) => (view === 'B' ? r.b : r.a)).length} />

      <div className="row between" style={{ marginBottom: 4 }}>
        <div className="tabs" style={{ flex: 1, marginBottom: 0 }}>
          {TABS.map((t) => (
            <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>{t.l}</button>
          ))}
        </div>
        {b.enabled && (
          <Seg value={view} options={[{ v: 'A', l: '版本 A' }, { v: 'B', l: b.label || '版本 B' }, { v: 'diff', l: 'B − A 差值' }]} onChange={setView} />
        )}
      </div>
      <div style={{ height: 18 }} />

      {done === 0 && running ? (
        <div className="empty"><span className="spin" /> 第一批人设正在回答，通常 10–40 秒…</div>
      ) : (
        <>
          {tab === 'overview' && <Overview run={run} rows={rows} view={view} />}
          {tab === 'segments' && <Segments run={run} rows={rows} view={view} />}
          {tab === 'aspects' && <Aspects run={run} rows={rows} view={view} />}
          {tab === 'voices' && <Voices run={run} rows={rows} view={view} />}
          {tab === 'report' && <Report run={run} filters={filters} />}
          {tab === 'robust' && <Robustness run={run} rows={rows} />}
          {tab === 'setup' && <Setup run={run} />}
        </>
      )}
    </div>
  );
}

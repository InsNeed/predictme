import { marked } from 'marked';
import { useMemo } from 'react';
import { Card } from '@/components/ui';
import { filterCount, type Filters } from '@/domain/aggregate';
import { PRICES, yuan } from '@/domain/pricing';
import { getRunner, peekRunner } from '@/state/runs';
import type { Run } from '@/domain/types';

export function Report({ run, filters }: { run: Run; filters: Filters }) {
  const runner = peekRunner(run.id);
  const busy = runner?.reporting ?? false;
  const html = useMemo(() => (run.report ? (marked.parse(run.report.markdown, { async: false }) as string) : ''), [run.report?.at]);
  const draft = runner?.reportDraft ?? '';
  const draftHtml = useMemo(() => (draft ? (marked.parse(draft, { async: false }) as string) : ''), [draft]);
  const nf = filterCount(filters);
  const describe = () => {
    const parts = Object.entries(filters.dims).filter(([, v]) => v.length).map(([k, v]) => `${k}=${v.join('/')}`);
    if (filters.ageMin > 15 || filters.ageMax < 80) parts.push(`年龄 ${filters.ageMin}–${filters.ageMax}`);
    if (filters.search) parts.push(`搜索「${filters.search}」`);
    return parts.join('；');
  };

  return (
    <div className="col gap16">
      <Card>
        <div className="row between">
          <div className="small">
            由 <b>{PRICES[run.config.cost.reportModel].label}</b>（高思考）读取统计和原话样本后撰写。它解读的是模拟结果，写法遵守课本：不把比例写成转化率，分群差异写成假设。
          </div>
          <div className="row">
            <button className="btn primary" disabled={busy || run.status === 'running'} onClick={() => getRunner(run).report(null, '全部人设')}>
              {busy ? <span className="spin" /> : null} {run.report ? '重新生成（全部）' : '生成报告（全部）'}
            </button>
            <button className="btn" disabled={busy || nf === 0 || run.status === 'running'} onClick={() => getRunner(run).report(filters, `筛选后：${describe()}`)} title={nf ? '' : '先在上方设置筛选条件'}>
              只解读当前筛选{nf ? `（${nf} 个条件）` : ''}
            </button>
          </div>
        </div>
        {run.status === 'running' && <div className="small muted mt8">运行结束后可以生成报告；开启了自动报告的话会自动生成。</div>}
        {runner?.lastError?.startsWith('报告') && <div className="note red mt8">{runner.lastError}</div>}
      </Card>
      {busy && runner && (
        <Card>
          <div className="row between small muted" style={{ marginBottom: 6 }}>
            <span>
              <span className="spin" />{' '}
              {runner.reportDraft
                ? `正在写正文 · 已写 ${runner.reportDraft.length} 字`
                : `正在思考 · 已想了约 ${runner.reportThinking} 字，通常要 1–4 分钟`}
              {' '}· 已用 {Math.round((Date.now() - runner.reportStarted) / 1000)} 秒
            </span>
            <button className="btn sm" onClick={() => runner.cancelReport()}>取消</button>
          </div>
          {runner.reportDraft && <div className="md" dangerouslySetInnerHTML={{ __html: draftHtml }} />}
        </Card>
      )}
      {run.report && !busy && (
        <Card>
          <div className="row between small muted" style={{ marginBottom: 6 }}>
            <span>范围：{run.report.scope}</span>
            <span>{new Date(run.report.at).toLocaleString('zh-CN')} · 花费 {yuan(run.report.cost)}</span>
          </div>
          <div className="md" dangerouslySetInnerHTML={{ __html: html }} />
        </Card>
      )}
    </div>
  );
}

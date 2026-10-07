import { useEffect, useState } from 'react';
import { Card } from '@/components/ui';
import { yuan } from '@/domain/pricing';
import { deleteRun, listRuns, loadRun, saveRun } from '@/storage/runs';
import { go } from '@/app/router';
import { forgetRun, useVersion } from '@/state/runs';
import type { RunMeta } from '@/domain/types';

const STATUS: Record<string, string> = { running: '运行中', paused: '已暂停', done: '完成', stopped: '已停止', budget: '到达预算', draft: '草稿' };

export function History() {
  const v = useVersion();
  const [list, setList] = useState<RunMeta[] | null>(null);
  useEffect(() => {
    listRuns().then(setList);
  }, [v]);

  async function setOutcome(m: RunMeta, field: 'actualTry' | 'actualPay', val: string) {
    const run = await loadRun(m.id);
    if (!run) return;
    const n = val.trim() === '' ? null : Math.max(0, Math.min(100, parseFloat(val)));
    run.outcome = { actualTry: run.outcome?.actualTry ?? null, actualPay: run.outcome?.actualPay ?? null, note: run.outcome?.note ?? '', [field]: Number.isFinite(n as number) ? n : null };
    await saveRun(run);
    setList(await listRuns());
  }

  const scored = (list ?? []).filter((m) => m.outcome && (m.outcome.actualPay != null || m.outcome.actualTry != null));
  const err = (pred: number | null, act: number | null | undefined) => (pred != null && act != null ? pred - act : null);
  const sq = scored.flatMap((m) => [err(m.payMean, m.outcome?.actualPay), err(m.tryMean, m.outcome?.actualTry)]).filter((x): x is number => x != null);
  const bias = sq.length ? sq.reduce((s, x) => s + x, 0) / sq.length : null;
  const mse = sq.length ? sq.reduce((s, x) => s + (x / 100) ** 2, 0) / sq.length : null;

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="eyebrow">LEDGER</div>
          <h1>预测记录与打分簿</h1>
          <p className="muted mt8" style={{ maxWidth: 760 }}>
            没有外部对照，就没有准确率。产品上线后，把真实的试用率、付费率填回来；积累几次，就能看到这套设定整体是偏高还是偏低（第六章）。
          </p>
        </div>
        <button className="btn primary" onClick={() => go('/new')}>＋ 新建预测</button>
      </div>

      {scored.length > 0 && (
        <div className="grid g3" style={{ marginBottom: 16 }}>
          <Card><div className="stat"><span className="label">已回填真实结果</span><span className="value num">{scored.length}</span><span className="foot">次预测</span></div></Card>
          <Card><div className="stat"><span className="label">平均偏差（模拟 − 真实）</span><span className="value num">{bias != null ? `${bias > 0 ? '+' : ''}${bias.toFixed(1)}` : '—'}<small>个百分点</small></span><span className="foot">正数表示模拟偏乐观</span></div></Card>
          <Card><div className="stat"><span className="label">平方误差均值</span><span className="value num">{mse != null ? mse.toFixed(3) : '—'}</span><span className="foot">按比例计算，越低越好；只有一组预测时不说明问题</span></div></Card>
        </div>
      )}

      <Card>
        {list === null ? <div className="empty"><span className="spin" /></div> : list.length === 0 ? (
          <div className="empty">还没有预测。<a href="#/new">新建一个</a></div>
        ) : (
          <table className="t">
            <thead>
              <tr>
                <th>预测</th><th>状态</th><th className="n">人设</th><th className="n">花费</th>
                <th className="n">模拟试用</th><th className="n">真实试用</th><th className="n">模拟付费</th><th className="n">真实付费</th><th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((m) => (
                <tr key={m.id}>
                  <td>
                    <a href={`#/run/${m.id}`}><b>{m.title}</b></a>
                    <div className="tiny muted">{new Date(m.createdAt).toLocaleString('zh-CN')}</div>
                  </td>
                  <td><span className={`tag ${m.status === 'done' ? 'teal' : m.status === 'running' ? 'red' : ''}`}>{STATUS[m.status]}</span></td>
                  <td className="n">{m.ok}/{m.n}</td>
                  <td className="n">{yuan(m.spent)}</td>
                  <td className="n">{m.tryMean != null ? `${m.tryMean.toFixed(0)}%` : '—'}</td>
                  <td className="n"><input type="number" style={{ width: 70, padding: '3px 6px' }} placeholder="%" defaultValue={m.outcome?.actualTry ?? ''} onBlur={(e) => setOutcome(m, 'actualTry', e.target.value)} /></td>
                  <td className="n">{m.payMean != null ? `${m.payMean.toFixed(0)}%` : '—'}</td>
                  <td className="n"><input type="number" style={{ width: 70, padding: '3px 6px' }} placeholder="%" defaultValue={m.outcome?.actualPay ?? ''} onBlur={(e) => setOutcome(m, 'actualPay', e.target.value)} /></td>
                  <td>
                    <button className="btn ghost sm" onClick={async () => { if (confirm(`删除「${m.title}」？`)) { forgetRun(m.id); await deleteRun(m.id); setList(await listRuns()); } }}>删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

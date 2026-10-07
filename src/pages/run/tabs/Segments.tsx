import { useMemo, useState } from 'react';
import { Chart, PALETTE } from '@/components/Chart';
import { Card, heatColor } from '@/components/ui';
import { answerFor, countTags, DIM_BY_ID, DIMS, fmt, groupStats, metricsFor, nps, sortKeys, stats, valuesOf, type Row, type View } from '@/domain/aggregate';
import type { Run } from '@/domain/types';

const MIN_N = 10;

export function Segments({ run, rows, view }: { run: Run; rows: Row[]; view: View }) {
  const metrics = useMemo(() => metricsFor(run.config.aspects.map((a) => a.name)), [run]);
  const [dimId, setDimId] = useState('domestic');
  const [metricId, setMetricId] = useState('pay');
  const [crossA, setCrossA] = useState('ageBand');
  const [crossB, setCrossB] = useState('group');
  const dim = DIM_BY_ID[dimId];
  const metric = metrics.find((m) => m.id === metricId)!;
  const groups = groupStats(rows, dim, view, metric);
  const unit = view === 'diff' ? (metric.unit === '%' ? ' 个百分点' : ' 分') : metric.unit;

  const tableCols = metrics.filter((m) => ['try', 'pay', 'active', 'still', 'choiceThis', 'wanting', 'liking', 'recommend', 'wtp'].includes(m.id));
  const table = useMemo(() => {
    const buckets = new Map<string, Row[]>();
    for (const r of rows) {
      const k = dim.get(r.p, answerFor(r, view === 'diff' ? 'A' : view));
      if (!k) continue;
      if (!buckets.has(k)) buckets.set(k, []);
      buckets.get(k)!.push(r);
    }
    const items = Array.from(buckets.entries()).map(([k, rs]) => {
      const cells = Object.fromEntries(tableCols.map((m) => {
        const s = stats(valuesOf(rs, view, m));
        return [m.id, m.id === 'wtp' ? s.median : s.mean];
      }));
      const top = countTags(rs, view, (a) => a.concerns)[0];
      const n = rs.filter((r) => (view === 'B' ? r.b : r.a)).length;
      return { k, n, cells, nps: nps(rs, view).score, top: top ? `${top[0]}（${top[1]}）` : '—' };
    });
    return sortKeys(items, dim.order, (x) => x.k, (x) => -x.n);
  }, [rows, dim, view, tableCols]);

  const ranges = Object.fromEntries(tableCols.map((m) => {
    const vals = table.filter((t) => t.n >= MIN_N).map((t) => t.cells[m.id]).filter(Number.isFinite);
    return [m.id, [Math.min(...vals), Math.max(...vals)]];
  }));

  const cross = useMemo(() => {
    const da = DIM_BY_ID[crossA];
    const db = DIM_BY_ID[crossB];
    const ka = groupStats(rows, da, view, metric).map((g) => g.key);
    const kb = groupStats(rows, db, view, metric).map((g) => g.key);
    const data: [number, number, number, number][] = [];
    ka.forEach((a, i) => kb.forEach((b, j) => {
      const rs = rows.filter((r) => { const ans = answerFor(r, view === 'diff' ? 'A' : view); return da.get(r.p, ans) === a && db.get(r.p, ans) === b; });
      const s = stats(valuesOf(rs, view, metric));
      if (s.n) data.push([j, i, +s.mean.toFixed(1), s.n]);
    }));
    return { ka, kb, data };
  }, [rows, crossA, crossB, metric, view]);

  const topHi = Math.max(0, ...groups.map((g) => (Number.isFinite(g.s.hi) ? g.s.hi : g.s.mean)));
  const niceCeil = (x: number) => {
    if (x <= 0) return 1;
    const step = 10 ** Math.floor(Math.log10(x));
    return Math.ceil((x * 1.08) / step) * step;
  };
  const vals = cross.data.map((d) => d[2]);
  const vmin = Math.min(...vals, view === 'diff' ? -1 : 0);
  const vmax = Math.max(...vals, 1);

  return (
    <div className="col gap16">
      <div className="note">
        模型扮演的群体，平均数可能接近，但<b>群体之间的差异和方向常常不可靠</b>，而且更像外人眼里的那群人（Bisbee 等 2024、Wang 等 2025）。把这里的差异当成值得用真实数据检验的假设。少于 {MIN_N} 人的组被淡化，误差线是均值的 95% 区间。
      </div>
      <Card>
        <div className="row">
          <span className="small">按</span>
          <select value={dimId} onChange={(e) => setDimId(e.target.value)} style={{ width: 220 }}>
            {DIMS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
          </select>
          <span className="small">分组，看</span>
          <select value={metricId} onChange={(e) => setMetricId(e.target.value)} style={{ width: 220 }}>
            {metrics.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
          {view === 'diff' && <span className="tag red">B − A 配对差值</span>}
        </div>
        <Chart height={Math.max(220, groups.length * 30 + 40)} option={{
          grid: { left: 8, right: 70, top: 10, bottom: 8, containLabel: true },
          tooltip: { trigger: 'axis', formatter: (p: any) => { const g = groups[p[0].dataIndex]; return `${g.key}<br/>均值 ${fmt(g.s.mean, metric.unit, 1)}<br/>95% 区间 ${fmt(g.s.lo, metric.unit, 1)} – ${fmt(g.s.hi, metric.unit, 1)}<br/>中位数 ${fmt(g.s.median, metric.unit, 1)} · n=${g.n}`; } },
          xAxis: { type: 'value', max: view !== 'diff' && metric.max && topHi > metric.max * 0.6 ? metric.max : (v: { max: number }) => niceCeil(Math.max(v.max, topHi)), ...(metric.min != null && view !== 'diff' ? { min: metric.min } : {}) },
          yAxis: { type: 'category', inverse: true, data: groups.map((g) => `${g.key}  (${g.n})`) },
          series: [
            { type: 'bar', barWidth: 16, data: groups.map((g) => ({ value: +g.s.mean.toFixed(2), itemStyle: { color: g.n < MIN_N ? '#d8cfbd' : PALETTE[0] } })) },
            {
              type: 'custom', z: 10,
              renderItem: (_: any, api: any) => {
                const i = api.value(0);
                const lo = api.coord([api.value(1), i]);
                const hi = api.coord([api.value(2), i]);
                const stroke = { stroke: '#1d1b17', lineWidth: 1.4 };
                return {
                  type: 'group',
                  children: [
                    { type: 'line', shape: { x1: lo[0], y1: lo[1], x2: hi[0], y2: hi[1] }, style: stroke },
                    { type: 'line', shape: { x1: lo[0], y1: lo[1] - 4, x2: lo[0], y2: lo[1] + 4 }, style: stroke },
                    { type: 'line', shape: { x1: hi[0], y1: hi[1] - 4, x2: hi[0], y2: hi[1] + 4 }, style: stroke },
                    { type: 'text', x: Math.max(hi[0], api.coord([api.value(3), i])[0]) + 6, y: hi[1], style: { text: fmt(api.value(3), metric.unit, 1), fill: '#4a463e', fontSize: 11, verticalAlign: 'middle' } },
                  ],
                };
              },
              data: groups.map((g, i) => [i, Number.isFinite(g.s.lo) ? g.s.lo : g.s.mean, Number.isFinite(g.s.hi) ? g.s.hi : g.s.mean, g.s.mean]),
            },
          ],
        }} />
        <div className="tiny muted">单位：{unit || '分'}</div>
      </Card>

      <Card title={`${dim.label} · 关键指标总表`} sub="颜色按列内相对高低（红高绿低），只比较 n≥10 的组">
        <div style={{ overflowX: 'auto' }}>
          <table className="t">
            <thead>
              <tr>
                <th>{dim.label}</th><th className="n">n</th>
                {tableCols.map((m) => <th key={m.id} className="n">{m.id === 'wtp' ? '心理价位中位' : m.label}</th>)}
                <th className="n">NPS</th><th>最常见顾虑</th>
              </tr>
            </thead>
            <tbody>
              {table.map((t) => (
                <tr key={t.k} className={t.n < MIN_N ? 'dim' : ''}>
                  <td><b>{t.k}</b></td>
                  <td className="n">{t.n}</td>
                  {tableCols.map((m) => {
                    const v = t.cells[m.id];
                    const [lo, hi] = ranges[m.id];
                    const tt = hi > lo ? (v - lo) / (hi - lo) : 0.5;
                    return <td key={m.id} className="n"><span className="heat" style={{ background: t.n >= MIN_N && Number.isFinite(v) ? heatColor(tt) : 'transparent' }}>{fmt(v, view === 'diff' ? '' : m.unit, 1)}</span></td>;
                  })}
                  <td className="n">{Number.isFinite(t.nps) ? t.nps.toFixed(0) : '—'}</td>
                  <td className="small">{t.top}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="交叉热力图" sub={`${metric.label} · 格子里是均值，带括号的不足 3 人，悬停看人数`}>
        <div className="row" style={{ marginBottom: 8 }}>
          <span className="small">行</span>
          <select value={crossA} onChange={(e) => setCrossA(e.target.value)} style={{ width: 200 }}>{DIMS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}</select>
          <span className="small">列</span>
          <select value={crossB} onChange={(e) => setCrossB(e.target.value)} style={{ width: 200 }}>{DIMS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}</select>
        </div>
        <Chart height={Math.max(240, cross.ka.length * 34 + 90)} option={{
          grid: { left: 8, right: 16, top: 10, bottom: 60, containLabel: true },
          tooltip: { formatter: (p: any) => `${cross.ka[p.data[1]]} × ${cross.kb[p.data[0]]}<br/>均值 ${p.data[2]} · n=${p.data[3]}` },
          xAxis: { type: 'category', data: cross.kb, axisLabel: { interval: 0, rotate: cross.kb.length > 6 ? 30 : 0 } },
          yAxis: { type: 'category', data: cross.ka, inverse: true },
          visualMap: { dimension: 2, min: vmin, max: vmax, calculable: true, orient: 'horizontal', left: 'center', bottom: 0, itemHeight: 160, inRange: { color: ['#2f6f73', '#ece6d8', '#c8452c'] }, textStyle: { fontSize: 10 } },
          series: [{ type: 'heatmap', data: cross.data, label: { show: true, formatter: (p: any) => (p.data[3] < 3 ? `(${p.data[2]})` : `${p.data[2]}`), fontSize: 11 }, itemStyle: { borderColor: '#fbf8f1', borderWidth: 2 } }],
        }} />
      </Card>
    </div>
  );
}

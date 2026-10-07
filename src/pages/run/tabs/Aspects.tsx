import { useMemo, useState } from 'react';
import { Chart, PALETTE } from '@/components/Chart';
import { Card } from '@/components/ui';
import { answerFor, DIM_BY_ID, DIMS, groupStats, metricsFor, stats, valuesOf, type Row, type View } from '@/domain/aggregate';
import type { Run } from '@/domain/types';

export function Aspects({ run, rows, view }: { run: Run; rows: Row[]; view: View }) {
  const names = run.config.aspects.map((a) => a.name);
  const ms = useMemo(() => metricsFor(names).filter((m) => m.id.startsWith('asp:')), [run]);
  const [dimId, setDimId] = useState('group');
  const [focus, setFocus] = useState(names[0] ?? '');
  const sv = view === 'diff' ? 'A' : view;
  const sA = ms.map((m) => stats(valuesOf(rows, 'A', m)));
  const sB = run.config.variantB.enabled ? ms.map((m) => stats(valuesOf(rows, 'B', m))) : null;
  const sCur = ms.map((m) => stats(valuesOf(rows, view, m)));
  const dim = DIM_BY_ID[dimId];

  const heat = useMemo(() => {
    const keys = groupStats(rows, dim, view, ms[0]).map((g) => g.key);
    const data: [number, number, number, number][] = [];
    ms.forEach((m, j) => {
      groupStats(rows, dim, view, m).forEach((g) => {
        const i = keys.indexOf(g.key);
        if (i >= 0 && g.n) data.push([i, j, +g.s.mean.toFixed(2), g.n]);
      });
    });
    return { keys, data };
  }, [rows, dim, view, ms]);

  const notes = useMemo(() => {
    const list = rows
      .map((r) => ({ r, a: answerFor(r, sv) }))
      .filter((x) => x.a?.aspects[focus])
      .map((x) => ({ name: x.r.p.name, meta: `${x.r.p.country} · ${x.r.p.age}岁 · ${x.r.p.occupation}`, s: x.a!.aspects[focus].s, n: x.a!.aspects[focus].n }));
    list.sort((a, b) => a.s - b.s);
    return { low: list.slice(0, 8), high: list.slice(-8).reverse() };
  }, [rows, focus, sv]);

  const hv = heat.data.map((d) => d[2]);

  return (
    <div className="col gap16">
      <div className="grid g2">
        <Card title="各方面平均分" sub="1–10 分">
          <Chart height={340} option={{
            legend: { bottom: 0 },
            tooltip: {},
            radar: { indicator: names.map((n) => ({ name: n, max: 10, min: 0 })), radius: '64%', center: ['50%', '48%'] },
            series: [{
              type: 'radar',
              data: [
                { name: '版本 A', value: sA.map((s) => +s.mean.toFixed(2)), areaStyle: { opacity: 0.12 }, lineStyle: { color: PALETTE[sB ? 4 : 0] }, itemStyle: { color: PALETTE[sB ? 4 : 0] } },
                ...(sB ? [{ name: run.config.variantB.label || '版本 B', value: sB.map((s) => +s.mean.toFixed(2)), areaStyle: { opacity: 0.12 }, lineStyle: { color: PALETTE[0] }, itemStyle: { color: PALETTE[0] } }] : []),
              ],
            }],
          }} />
        </Card>
        <Card title={view === 'diff' ? '各方面 B − A' : '均值与分散'} sub={view === 'diff' ? '配对差值与 95% 区间' : '条形为均值，黑线为 ±1 标准差'}>
          <Chart height={340} option={{
            grid: { left: 8, right: 40, top: 10, bottom: 8, containLabel: true },
            tooltip: { trigger: 'axis', formatter: (p: any) => { const s = sCur[p[0].dataIndex]; return `${names[p[0].dataIndex]}<br/>均值 ${s.mean.toFixed(2)} · 标准差 ${s.sd.toFixed(2)}<br/>中位数 ${s.median.toFixed(1)} · n=${s.n}`; } },
            xAxis: { type: 'value', ...(view === 'diff' ? {} : { min: 0, max: 10 }) },
            yAxis: { type: 'category', inverse: true, data: names },
            series: [
              { type: 'bar', barWidth: 14, data: sCur.map((s) => ({ value: +s.mean.toFixed(2), itemStyle: { color: view === 'diff' ? (s.lo > 0 ? PALETTE[0] : s.hi < 0 ? PALETTE[1] : '#c9bfab') : s.mean >= 6.5 ? PALETTE[0] : s.mean <= 4.5 ? PALETTE[1] : PALETTE[2] } })), label: { show: true, position: 'right', formatter: (p: any) => p.value.toFixed(1) } },
              {
                type: 'custom', z: 10,
                renderItem: (_: any, api: any) => {
                  const lo = api.coord([api.value(1), api.value(0)]);
                  const hi = api.coord([api.value(2), api.value(0)]);
                  return { type: 'line', shape: { x1: lo[0], y1: lo[1], x2: hi[0], y2: hi[1] }, style: { stroke: '#1d1b17', lineWidth: 1.2 } };
                },
                data: sCur.map((s, i) => (view === 'diff' ? [i, s.lo, s.hi] : [i, Math.max(0, s.mean - s.sd), Math.min(10, s.mean + s.sd)])),
              },
            ],
          }} />
        </Card>
      </div>

      <Card title="各方面 × 人群" sub="格子是该组均值；带括号的组不足 3 人，只作参考" right={<select value={dimId} onChange={(e) => setDimId(e.target.value)} style={{ width: 220 }}>{DIMS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}</select>}>
        <Chart height={Math.max(260, names.length * 34 + 80)} option={{
          grid: { left: 8, right: 16, top: 10, bottom: 60, containLabel: true },
          tooltip: { formatter: (p: any) => `${heat.keys[p.data[0]]} · ${names[p.data[1]]}<br/>均值 ${p.data[2]} · n=${p.data[3]}` },
          xAxis: { type: 'category', data: heat.keys, axisLabel: { interval: 0, rotate: heat.keys.length > 6 ? 30 : 0 } },
          yAxis: { type: 'category', data: names, inverse: true },
          visualMap: { dimension: 2, min: Math.min(...hv, view === 'diff' ? -1 : 1), max: Math.max(...hv, view === 'diff' ? 1 : 10), calculable: true, orient: 'horizontal', left: 'center', bottom: 0, itemHeight: 160, inRange: { color: ['#2f6f73', '#ece6d8', '#c8452c'] } },
          series: [{ type: 'heatmap', data: heat.data, label: { show: true, formatter: (p: any) => (p.data[3] < 3 ? `(${p.data[2].toFixed(1)})` : p.data[2].toFixed(1)), fontSize: 11 }, itemStyle: { borderColor: '#fbf8f1', borderWidth: 2 } }],
        }} />
      </Card>

      <Card title="他们怎么说" right={
        <div className="row" style={{ gap: 4 }}>
          {names.map((n) => <button key={n} className={`chip ${focus === n ? 'on' : ''}`} onClick={() => setFocus(n)}>{n}</button>)}
        </div>
      }>
        <div className="grid g2">
          {[['打分最低', notes.low, PALETTE[1]], ['打分最高', notes.high, PALETTE[0]]].map(([title, list, color]) => (
            <div key={title as string}>
              <h4 style={{ marginBottom: 8, color: color as string }}>{title as string}</h4>
              <table className="t">
                <tbody>
                  {(list as typeof notes.low).map((x, i) => (
                    <tr key={i}>
                      <td className="n" style={{ width: 36 }}><b>{x.s}</b></td>
                      <td>
                        <div>{x.n || <span className="muted">（没写理由）</span>}</div>
                        <div className="tiny muted">{x.name} · {x.meta}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

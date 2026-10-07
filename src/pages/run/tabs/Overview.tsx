import { useMemo } from 'react';
import { Chart, PALETTE } from '@/components/Chart';
import { Card, Stat } from '@/components/ui';
import { answerFor, countBy, countTags, fmt, histogram, metricsFor, nps, stats, valuesOf, type Row, type View } from '@/domain/aggregate';
import { productFor } from '@/domain/prompts';
import type { Answer, Run } from '@/domain/types';
import { CHOICE_LABEL, EMOTION_COLOR, PRICE_FEELS, TIMINGS } from '@/domain/vocab';

const ci = (s: { lo: number; hi: number; n: number }) => (s.n > 1 ? `95% 区间 ${s.lo.toFixed(0)}–${s.hi.toFixed(0)}` : '');

function listPriceMonthly(run: Run, v: 'A' | 'B'): number | null {
  const p = productFor(run.config, v);
  if (!p.priceCNY) return null;
  if (p.pricePeriod === '月') return p.priceCNY;
  if (p.pricePeriod === '年') return p.priceCNY / 12;
  return null;
}

export function Overview({ run, rows, view }: { run: Run; rows: Row[]; view: View }) {
  if (view === 'diff') return <DiffOverview run={run} rows={rows} />;
  return <SingleOverview run={run} rows={rows} view={view} />;
}

function SingleOverview({ run, rows, view }: { run: Run; rows: Row[]; view: 'A' | 'B' }) {
  const ms = useMemo(() => Object.fromEntries(metricsFor([]).map((m) => [m.id, m])), []);
  const S = (id: string) => stats(valuesOf(rows, view, ms[id]));
  const answers = rows.map((r) => answerFor(r, view)).filter((a): a is Answer => !!a);
  const n = answers.length;
  const tr = S('try'), pay = S('pay'), choice = S('choiceThis'), still = S('still'), wtp = S('wtp');
  const np = nps(rows, view);
  const q = run.config.question;
  const lp = listPriceMonthly(run, view);

  const funnel = useMemo(() => {
    const m = (f: (a: Answer) => number) => (n ? answers.reduce((s, a) => s + f(a), 0) / n : 0);
    return [
      { k: '会停下来细看', v: m((a) => a.attention * 10) },
      { k: '会试用', v: m((a) => a.prob.try) },
      { k: '试用且 30 天后仍在用', v: m((a) => (a.prob.try * a.prob.active_30d) / 100) },
      { k: '会付第一笔', v: m((a) => a.prob.pay) },
      { k: '付费且续费', v: m((a) => (a.prob.pay * a.prob.renew) / 100) },
      { k: '一年后仍在用/付费', v: m((a) => a.prob.still_1y) },
    ];
  }, [answers, n]);

  const hTry = histogram(answers.map((a) => a.prob.try), 0, 100, 10);
  const hPay = histogram(answers.map((a) => a.prob.pay), 0, 100, 10);
  const choices = countBy(rows, view, (a) => CHOICE_LABEL[a.choice], Object.values(CHOICE_LABEL));
  const timing = countBy(rows, view, (a) => a.timing, TIMINGS);
  const emotions = countBy(rows, view, (a) => a.emotion.primary);
  const att = countTags(rows, view, (a) => a.attractions).slice(0, 12);
  const con = countTags(rows, view, (a) => a.concerns).slice(0, 12);
  const feel = countBy(rows, view, (a) => a.wtp.price_feel || undefined, PRICE_FEELS);
  const wtps = answers.map((a) => a.wtp.amountCNYMonth).filter((x): x is number => x != null && x > 0);
  const wtpMax = Math.max(lp ? lp * 3 : 0, ...wtps.length ? [Math.min(Math.max(...wtps), (lp ?? 50) * 6)] : [50]);
  const hW = histogram(wtps.map((x) => Math.min(x, wtpMax)), 0, wtpMax, 12);
  const ident = histogram(answers.map((a) => a.identity_fit), -5, 6, 11);

  return (
    <div className="col gap16">
      <div className="grid g6">
        <Card><Stat label="有效回答" value={n} unit="人" foot={`共 ${run.personas.length} 个人设`} /></Card>
        <Card><Stat label={`${q.window}内试用概率（均值）`} value={fmt(tr.mean, '')} unit="%" foot={ci(tr)} accent /></Card>
        <Card><Stat label={`${q.window}内首笔付费概率`} value={fmt(pay.mean, '')} unit="%" foot={ci(pay)} accent /></Card>
        <Card><Stat label="比较题选本产品" value={fmt(choice.mean, '')} unit="%" foot="相对现有做法和「都不用」" /></Card>
        <Card><Stat label="推荐净值（NPS）" value={Number.isFinite(np.score) ? np.score.toFixed(0) : '—'} foot={`推荐 ${np.pro} · 中立 ${np.pas} · 贬损 ${np.det}`} /></Card>
        <Card><Stat label="陈述心理价位（中位）" value={Number.isFinite(wtp.median) ? `¥${wtp.median.toFixed(wtp.median < 10 ? 1 : 0)}` : '—'} unit="/月" foot={lp ? `标价约 ¥${lp.toFixed(1)}/月；陈述值通常偏高` : '按月折算'} /></Card>
      </div>

      <div className="note">
        这些数字是模拟人设<b>嘴上</b>给出的概率的平均，不是转化率。课本第五章：意图和行为的缺口主要来自「说会、没做」，假设性支付通常高估，而且没有固定倍数可以校正。
        {(q.baseRateTry != null || q.baseRatePay != null) && (
          <> 你填写的外部基础率是：{q.baseRateTry != null && <b>试用 {q.baseRateTry}%</b>} {q.baseRatePay != null && <b>付费 {q.baseRatePay}%</b>}。按第六章，应以基础率为起点，模拟结果只用来判断往哪边调。</>
        )}
      </div>

      <div className="grid g3">
        <Card title="从看到到长期付费" sub="每一级是所有人概率的平均" className="span2">
          <Chart height={280} option={{
            grid: { left: 8, right: 60, top: 10, bottom: 8, containLabel: true },
            xAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
            yAxis: { type: 'category', inverse: true, data: funnel.map((f) => f.k) },
            tooltip: { trigger: 'axis', valueFormatter: (v: number) => `${v.toFixed(1)}%` },
            series: [{
              type: 'bar', data: funnel.map((f, i) => ({ value: +f.v.toFixed(1), itemStyle: { color: i < 3 ? PALETTE[1] : PALETTE[0] } })), barWidth: 22,
              label: { show: true, position: 'right', formatter: (p: any) => `${p.value}%`, fontFamily: 'var(--mono)' },
              markLine: (q.baseRatePay != null || q.baseRateTry != null) ? {
                symbol: 'none', lineStyle: { type: 'dashed', color: '#1d1b17' }, label: { formatter: '{b}', fontSize: 10 },
                data: [...(q.baseRateTry != null ? [{ xAxis: q.baseRateTry, name: `试用基础率 ${q.baseRateTry}%` }] : []), ...(q.baseRatePay != null ? [{ xAxis: q.baseRatePay, name: `付费基础率 ${q.baseRatePay}%` }] : [])],
              } : undefined,
            }],
          }} />
          <div className="tiny muted">绿色是「用」这一侧，红色是「付钱」这一侧。一次（试用、首付）和一串（30 天、续费、一年）是不同的预测对象（第四章）。</div>
        </Card>
        <Card title="比较题" sub="本产品 vs 现有做法 vs 都不用">
          <Chart height={250} option={{
            tooltip: { trigger: 'item' },
            legend: { bottom: 0 },
            series: [{ type: 'pie', radius: ['48%', '72%'], center: ['50%', '44%'], data: choices.map(([k, v], i) => ({ name: k, value: v, itemStyle: { color: [PALETTE[0], PALETTE[4], '#c9bfab'][i] } })), label: { formatter: '{d}%' } }],
          }} />
        </Card>
      </div>

      <div className="grid g3">
        <Card title="概率分布" sub="模型扮演的回答常比真人更集中（第七章）">
          <Chart height={230} option={{
            legend: { top: 0, right: 0 },
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: hTry.map((h) => `${h.label}–${+h.label + 10}`) },
            yAxis: { type: 'value', name: '人数' },
            series: [
              { name: '试用', type: 'bar', data: hTry.map((h) => h.n), itemStyle: { color: PALETTE[1] } },
              { name: '首付', type: 'bar', data: hPay.map((h) => h.n), itemStyle: { color: PALETTE[0] } },
            ],
          }} />
          <div className="tiny muted">首付概率标准差 {fmt(pay.sd, '')}，四分位 {fmt(pay.q1, '')}–{fmt(pay.q3, '')}</div>
        </Card>
        <Card title="采用时机" sub="这群人会在什么时候进来">
          <Chart height={250} option={{
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: timing.map(([k]) => k), axisLabel: { interval: 0, rotate: 20 } },
            yAxis: { type: 'value' },
            series: [{ type: 'bar', data: timing.map(([k, v]) => ({ value: v, itemStyle: { color: k === '不会' ? '#c9bfab' : k === '马上' ? PALETTE[0] : PALETTE[2] } })), barWidth: '55%' }],
          }} />
        </Card>
        <Card title="想要 vs 预计喜欢" sub="两者分开：想要不等于用起来喜欢（第一章）">
          <Chart height={250} option={{
            grid: { left: 8, right: 16, top: 16, bottom: 8, containLabel: true },
            xAxis: { type: 'value', min: 0, max: 10, name: '想要', nameLocation: 'middle', nameGap: 22 },
            yAxis: { type: 'value', min: 0, max: 10, name: '预计喜欢' },
            tooltip: { formatter: (p: any) => `${p.data[3]}<br/>想要 ${p.data[0]} · 喜欢 ${p.data[1]} · 付费 ${p.data[2]}%` },
            visualMap: { show: false, dimension: 2, min: 0, max: 100, inRange: { color: ['#7fa9a5', '#b8892f', '#c8452c'] } },
            series: [{ type: 'scatter', symbolSize: 9, data: rows.filter((r) => answerFor(r, view)).map((r) => { const a = answerFor(r, view)!; return [a.wanting + (((r.p.idx * 37) % 11) / 11 - 0.5) * 0.45, a.expected_liking + (((r.p.idx * 53) % 13) / 13 - 0.5) * 0.45, a.prob.pay, r.p.name]; }), itemStyle: { opacity: 0.75 } }],
          }} />
        </Card>
      </div>

      <div className="grid g2">
        <Card title="吸引点" sub="提到的人数">
          <TagBars data={att} color={PALETTE[1]} total={n} />
        </Card>
        <Card title="顾虑" sub="提到的人数">
          <TagBars data={con} color={PALETTE[0]} total={n} />
        </Card>
      </div>

      <div className="grid g3">
        <Card title="第一情绪">
          <Chart height={240} option={{
            tooltip: { trigger: 'item' },
            series: [{ type: 'pie', radius: ['30%', '70%'], roseType: 'radius', data: emotions.map(([k, v]) => ({ name: k, value: v, itemStyle: { color: EMOTION_COLOR[k] ?? '#8a8376' } })), label: { formatter: '{b} {c}' } }],
          }} />
        </Card>
        <Card title="陈述心理价位" sub={lp ? `按月折算，虚线为标价 ¥${lp.toFixed(1)}` : '按月折算'}>
          <Chart height={240} option={{
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: hW.map((h) => `¥${h.label}`) },
            yAxis: { type: 'value' },
            series: [{
              type: 'bar', data: hW.map((h) => h.n), itemStyle: { color: PALETTE[2] },
              markLine: lp ? { symbol: 'none', lineStyle: { color: '#1d1b17', type: 'dashed' }, label: { formatter: '标价' }, data: [{ xAxis: Math.min(11, Math.floor(lp / (wtpMax / 12))) }] } : undefined,
            }],
          }} />
          <div className="row small">{feel.map(([k, v]) => <span key={k} className="tag">{k} {v}</span>)}</div>
        </Card>
        <Card title="身份契合" sub="−5 完全不像我会用 · +5 太像我了">
          <Chart height={240} option={{
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: ident.map((h) => h.label) },
            yAxis: { type: 'value' },
            series: [{ type: 'bar', data: ident.map((h) => ({ value: h.n, itemStyle: { color: +h.label < 0 ? PALETTE[1] : PALETTE[0] } })) }],
          }} />
        </Card>
      </div>

      <Card title="一年后仍在用 / 付费" sub="一串行为，特质和习惯在这里更能发力（第二、四章）">
        <div className="row gap16">
          <Stat label="均值" value={fmt(still.mean, '')} unit="%" foot={ci(still)} />
          <div style={{ flex: 1, minWidth: 300 }}>
            <Chart height={120} option={{
              grid: { left: 8, right: 8, top: 8, bottom: 8, containLabel: true },
              xAxis: { type: 'category', data: histogram(answers.map((a) => a.prob.still_1y), 0, 100, 10).map((h) => h.label) },
              yAxis: { type: 'value', show: false },
              series: [{ type: 'bar', data: histogram(answers.map((a) => a.prob.still_1y), 0, 100, 10).map((h) => h.n), itemStyle: { color: PALETTE[3] } }],
            }} />
          </div>
        </div>
      </Card>
    </div>
  );
}

function TagBars({ data, color, total }: { data: [string, number][]; color: string; total: number }) {
  if (!data.length) return <div className="muted small">暂无</div>;
  return (
    <Chart height={Math.max(160, data.length * 24 + 20)} option={{
      grid: { left: 8, right: 50, top: 4, bottom: 4, containLabel: true },
      xAxis: { type: 'value', show: false },
      yAxis: { type: 'category', inverse: true, data: data.map(([k]) => k) },
      tooltip: { trigger: 'axis', valueFormatter: (v: number) => `${v} 人（${total ? ((v / total) * 100).toFixed(0) : 0}%）` },
      series: [{ type: 'bar', data: data.map(([, v]) => v), itemStyle: { color }, barWidth: 14, label: { show: true, position: 'right', formatter: (p: any) => `${p.value} · ${total ? ((p.value / total) * 100).toFixed(0) : 0}%` } }],
    }} />
  );
}

function DiffOverview({ run, rows }: { run: Run; rows: Row[] }) {
  const ms = metricsFor(run.config.aspects.map((a) => a.name)).filter((m) => m.id !== 'wtp' && m.id !== 'confidence');
  const diffs = ms.map((m) => ({ m, s: stats(valuesOf(rows, 'diff', m)) })).filter((d) => d.s.n > 0);
  const pct = diffs.filter((d) => d.m.unit === '%');
  const score = diffs.filter((d) => d.m.unit !== '%');
  const bLabel = run.config.variantB.label || '版本 B';
  const chA = countBy(rows, 'A', (a) => CHOICE_LABEL[a.choice], Object.values(CHOICE_LABEL));
  const chB = countBy(rows, 'B', (a) => CHOICE_LABEL[a.choice], Object.values(CHOICE_LABEL));
  const conA = new Map(countTags(rows, 'A', (a) => a.concerns));
  const conB = new Map(countTags(rows, 'B', (a) => a.concerns));
  const conKeys = Array.from(new Set([...conA.keys(), ...conB.keys()])).sort((x, y) => (conA.get(y) ?? 0) + (conB.get(y) ?? 0) - (conA.get(x) ?? 0) - (conB.get(x) ?? 0)).slice(0, 12);

  const diffChart = (items: typeof diffs, unit: string) => ({
    grid: { left: 8, right: 30, top: 10, bottom: 8, containLabel: true },
    tooltip: { trigger: 'axis', formatter: (p: any) => { const d = items[p[0].dataIndex]; return `${d.m.label}<br/>均值差 ${d.s.mean.toFixed(2)}${unit}<br/>95% 区间 ${d.s.lo.toFixed(2)} – ${d.s.hi.toFixed(2)}<br/>配对 n=${d.s.n}`; } },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', inverse: true, data: items.map((d) => d.m.label) },
    series: [
      { type: 'bar', data: items.map((d) => ({ value: +d.s.mean.toFixed(2), itemStyle: { color: d.s.lo > 0 ? PALETTE[0] : d.s.hi < 0 ? PALETTE[1] : '#c9bfab' } })), barWidth: 14 },
      {
        type: 'custom', renderItem: (_: any, api: any) => {
          const i = api.value(0);
          const lo = api.coord([api.value(1), i]);
          const hi = api.coord([api.value(2), i]);
          return { type: 'group', children: [
            { type: 'line', shape: { x1: lo[0], y1: lo[1], x2: hi[0], y2: hi[1] }, style: { stroke: '#1d1b17', lineWidth: 1.2 } },
            { type: 'line', shape: { x1: lo[0], y1: lo[1] - 4, x2: lo[0], y2: lo[1] + 4 }, style: { stroke: '#1d1b17' } },
            { type: 'line', shape: { x1: hi[0], y1: hi[1] - 4, x2: hi[0], y2: hi[1] + 4 }, style: { stroke: '#1d1b17' } },
          ] };
        },
        encode: { x: [1, 2], y: 0 }, data: items.map((d, i) => [i, d.s.lo, d.s.hi]), z: 10,
      },
    ],
  });

  return (
    <div className="col gap16">
      <div className="note teal">
        同一批人设分别看了 A 和「{bLabel}」，下面是每个人 B 减 A 的<b>配对差值</b>。红色表示 B 明显更高，绿色表示明显更低，灰色表示区间跨过 0。这是这套工具最站得住的信号，但仍需在换措辞后复现，并用真实实验确认（第七章、附录 C）。
      </div>
      <div className="grid g2">
        <Card title="概率类指标（百分点）">
          <Chart height={Math.max(200, pct.length * 34)} option={diffChart(pct, ' 个百分点')} />
        </Card>
        <Card title="评分类指标（分）">
          <Chart height={Math.max(200, score.length * 26)} option={diffChart(score, ' 分')} />
        </Card>
      </div>
      <div className="grid g2">
        <Card title="比较题选择">
          <Chart height={240} option={{
            legend: { top: 0 }, tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: Object.values(CHOICE_LABEL) },
            yAxis: { type: 'value' },
            series: [
              { name: 'A', type: 'bar', data: Object.values(CHOICE_LABEL).map((k) => chA.find(([x]) => x === k)?.[1] ?? 0), itemStyle: { color: PALETTE[4] } },
              { name: bLabel, type: 'bar', data: Object.values(CHOICE_LABEL).map((k) => chB.find(([x]) => x === k)?.[1] ?? 0), itemStyle: { color: PALETTE[0] } },
            ],
          }} />
        </Card>
        <Card title="顾虑对比">
          <Chart height={Math.max(220, conKeys.length * 26)} option={{
            legend: { top: 0 }, tooltip: { trigger: 'axis' },
            grid: { left: 8, right: 16, top: 26, bottom: 8, containLabel: true },
            xAxis: { type: 'value' },
            yAxis: { type: 'category', inverse: true, data: conKeys },
            series: [
              { name: 'A', type: 'bar', data: conKeys.map((k) => conA.get(k) ?? 0), itemStyle: { color: PALETTE[4] }, barWidth: 9 },
              { name: bLabel, type: 'bar', data: conKeys.map((k) => conB.get(k) ?? 0), itemStyle: { color: PALETTE[0] }, barWidth: 9 },
            ],
          }} />
        </Card>
      </div>
    </div>
  );
}

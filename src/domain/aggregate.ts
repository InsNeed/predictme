import type { Answer, CallRecord, Persona, Run } from './types';
import { AGE_BANDS, CHOICE_LABEL, EMOTIONS, EXPOSURE_LABEL, INCOME_LABELS, PRICE_FEELS, TIMINGS, TRAIT_LABEL } from './vocab';
import { GROUPS } from './markets';

export interface Row {
  p: Persona;
  a?: Answer;
  b?: Answer;
  rt?: Answer;
  aRec?: CallRecord;
}

export type View = 'A' | 'B' | 'diff';

export function buildRows(run: Run): Row[] {
  return run.personas.map((p) => {
    const a = run.calls[`${p.id}|A|main`];
    const b = run.calls[`${p.id}|B|main`];
    const rt = run.calls[`${p.id}|A|retest`];
    return {
      p,
      a: a?.status === 'ok' ? a.answer : undefined,
      b: b?.status === 'ok' ? b.answer : undefined,
      rt: rt?.status === 'ok' ? rt.answer : undefined,
      aRec: a,
    };
  });
}

export function answerFor(r: Row, view: View): Answer | undefined {
  return view === 'B' ? r.b : r.a;
}

export interface Dim {
  id: string;
  label: string;
  get: (p: Persona, a?: Answer) => string | undefined;
  order?: string[];
  answerBased?: boolean;
}

const tertile = (x: number) => (x >= 67 ? '高' : x <= 33 ? '低' : '中');

export const DIMS: Dim[] = [
  { id: 'domestic', label: '国内 / 海外', get: (p) => (p.domestic ? '国内' : '海外'), order: ['国内', '海外'] },
  { id: 'group', label: '地区', get: (p) => p.group, order: GROUPS },
  { id: 'country', label: '国家/地区', get: (p) => p.country },
  { id: 'ageBand', label: '年龄段', get: (p) => p.ageBand, order: AGE_BANDS },
  { id: 'gender', label: '性别', get: (p) => p.gender, order: ['女', '男'] },
  { id: 'cityTier', label: '城市层级', get: (p) => p.cityTier },
  { id: 'income', label: '收入（当地相对）', get: (p) => p.incomeLabel, order: INCOME_LABELS },
  { id: 'occupation', label: '职业', get: (p) => p.occupation },
  { id: 'family', label: '家庭状况', get: (p) => p.family },
  { id: 'diaspora', label: '海外华人', get: (p) => (p.domestic ? undefined : p.diaspora ? '华人' : '非华人'), order: ['华人', '非华人'] },
  { id: 'history', label: '主要付费经历', get: (p) => p.historyKey },
  { id: 'digital', label: '数字习惯', get: (p) => p.digitalHabit },
  { id: 'peer', label: '身边人对付费的态度', get: (p) => p.peerNorm },
  { id: 'mood', label: '当下心情', get: (p) => p.mood },
  { id: 'event', label: '近期事件', get: (p) => p.recentEvent },
  { id: 'channel', label: '接触渠道', get: (p) => p.channel },
  { id: 'exposure', label: '看到多少信息', get: (p) => EXPOSURE_LABEL[p.exposure], order: Object.values(EXPOSURE_LABEL) },
  ...(Object.keys(TRAIT_LABEL) as (keyof typeof TRAIT_LABEL)[]).map((k) => ({
    id: `trait_${k}`, label: `${TRAIT_LABEL[k]}（相对同龄人）`, get: (p: Persona) => tertile(p.traits[k]), order: ['低', '中', '高'],
  })),
  { id: 'choice', label: '比较题选择', get: (_p, a) => (a ? CHOICE_LABEL[a.choice] : undefined), order: Object.values(CHOICE_LABEL), answerBased: true },
  { id: 'emotion', label: '主要情绪', get: (_p, a) => a?.emotion.primary, order: EMOTIONS, answerBased: true },
  { id: 'timing', label: '采用时机', get: (_p, a) => a?.timing, order: [...TIMINGS], answerBased: true },
  { id: 'priceFeel', label: '价格感受', get: (_p, a) => a?.wtp.price_feel || undefined, order: PRICE_FEELS, answerBased: true },
];

export const DIM_BY_ID = Object.fromEntries(DIMS.map((d) => [d.id, d]));

export interface Metric {
  id: string;
  label: string;
  unit: '%' | '/10' | '元/月' | '' | '分';
  max: number;
  min?: number;
  get: (a: Answer) => number | null;
}

export function metricsFor(aspects: string[]): Metric[] {
  const base: Metric[] = [
    { id: 'try', label: '试用概率', unit: '%', max: 100, get: (a) => a.prob.try },
    { id: 'pay', label: '首笔付费概率', unit: '%', max: 100, get: (a) => a.prob.pay },
    { id: 'active', label: '试用后 30 天仍在用', unit: '%', max: 100, get: (a) => a.prob.active_30d },
    { id: 'renew', label: '付费后续费', unit: '%', max: 100, get: (a) => a.prob.renew },
    { id: 'still', label: '一年后仍在用/付费', unit: '%', max: 100, get: (a) => a.prob.still_1y },
    { id: 'choiceThis', label: '比较题选本产品', unit: '%', max: 100, get: (a) => (a.choice === 'this' ? 100 : 0) },
    { id: 'attention', label: '注意力', unit: '/10', max: 10, get: (a) => a.attention },
    { id: 'clarity', label: '看懂程度', unit: '/10', max: 10, get: (a) => a.clarity },
    { id: 'wanting', label: '想要', unit: '/10', max: 10, get: (a) => a.wanting },
    { id: 'liking', label: '预计喜欢', unit: '/10', max: 10, get: (a) => a.expected_liking },
    { id: 'recommend', label: '推荐意愿', unit: '/10', max: 10, get: (a) => a.recommend },
    { id: 'identity', label: '身份契合', unit: '', max: 5, min: -5, get: (a) => a.identity_fit },
    { id: 'confidence', label: '自评确定度', unit: '%', max: 100, get: (a) => a.self_confidence },
    { id: 'wtp', label: '陈述支付意愿', unit: '元/月', max: 0, get: (a) => a.wtp.amountCNYMonth },
  ];
  return [...base, ...aspects.map((n) => ({ id: `asp:${n}`, label: n, unit: '分' as const, max: 10, min: 1, get: (a: Answer) => a.aspects[n]?.s ?? null }))];
}

export function valuesOf(rows: Row[], view: View, m: Metric): number[] {
  const out: number[] = [];
  for (const r of rows) {
    if (view === 'diff') {
      if (!r.a || !r.b) continue;
      const x = m.get(r.a);
      const y = m.get(r.b);
      if (x == null || y == null) continue;
      out.push(y - x);
    } else {
      const a = answerFor(r, view);
      if (!a) continue;
      const v = m.get(a);
      if (v != null && Number.isFinite(v)) out.push(v);
    }
  }
  return out;
}

export interface Stats {
  n: number;
  mean: number;
  sd: number;
  se: number;
  lo: number;
  hi: number;
  median: number;
  q1: number;
  q3: number;
}

function quantile(sorted: number[], q: number): number {
  if (!sorted.length) return NaN;
  const pos = (sorted.length - 1) * q;
  const b = Math.floor(pos);
  const rest = pos - b;
  return sorted[b + 1] !== undefined ? sorted[b] + rest * (sorted[b + 1] - sorted[b]) : sorted[b];
}

export function stats(v: number[]): Stats {
  const n = v.length;
  if (!n) return { n: 0, mean: NaN, sd: NaN, se: NaN, lo: NaN, hi: NaN, median: NaN, q1: NaN, q3: NaN };
  const mean = v.reduce((s, x) => s + x, 0) / n;
  const sd = n > 1 ? Math.sqrt(v.reduce((s, x) => s + (x - mean) ** 2, 0) / (n - 1)) : 0;
  const se = n > 1 ? sd / Math.sqrt(n) : NaN;
  const sorted = v.slice().sort((a, b) => a - b);
  return { n, mean, sd, se, lo: mean - 1.96 * se, hi: mean + 1.96 * se, median: quantile(sorted, 0.5), q1: quantile(sorted, 0.25), q3: quantile(sorted, 0.75) };
}

export interface GroupStat {
  key: string;
  n: number;
  s: Stats;
}

export function groupStats(rows: Row[], dim: Dim, view: View, m: Metric): GroupStat[] {
  const buckets = new Map<string, Row[]>();
  for (const r of rows) {
    const k = dim.get(r.p, answerFor(r, view === 'diff' ? 'A' : view));
    if (!k) continue;
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k)!.push(r);
  }
  const out = Array.from(buckets.entries()).map(([key, rs]) => {
    const s = stats(valuesOf(rs, view, m));
    return { key, n: s.n, s };
  });
  return sortKeys(out, dim.order, (g) => g.key, (g) => -g.n);
}

export function sortKeys<T>(items: T[], order: string[] | undefined, key: (t: T) => string, fallback: (t: T) => number): T[] {
  return items.sort((x, y) => {
    if (order) {
      const ix = order.indexOf(key(x));
      const iy = order.indexOf(key(y));
      if (ix >= 0 || iy >= 0) return (ix < 0 ? 999 : ix) - (iy < 0 ? 999 : iy);
    }
    return fallback(x) - fallback(y);
  });
}

export function countTags(rows: Row[], view: View, pick: (a: Answer) => string[]): [string, number][] {
  const m = new Map<string, number>();
  for (const r of rows) {
    const a = answerFor(r, view === 'diff' ? 'A' : view);
    if (!a) continue;
    for (const t of new Set(pick(a))) m.set(t, (m.get(t) ?? 0) + 1);
  }
  return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
}

export function countBy(rows: Row[], view: View, f: (a: Answer) => string | undefined, order?: readonly string[]): [string, number][] {
  const m = new Map<string, number>();
  for (const r of rows) {
    const a = answerFor(r, view === 'diff' ? 'A' : view);
    if (!a) continue;
    const k = f(a);
    if (!k) continue;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  const arr = Array.from(m.entries());
  return order ? sortKeys(arr, [...order], (x) => x[0], (x) => -x[1]) : arr.sort((a, b) => b[1] - a[1]);
}

export function nps(rows: Row[], view: View): { score: number; pro: number; pas: number; det: number; n: number } {
  let pro = 0, pas = 0, det = 0;
  for (const r of rows) {
    const a = answerFor(r, view === 'diff' ? 'A' : view);
    if (!a) continue;
    if (a.recommend >= 9) pro++;
    else if (a.recommend >= 7) pas++;
    else det++;
  }
  const n = pro + pas + det;
  return { score: n ? ((pro - det) / n) * 100 : NaN, pro, pas, det, n };
}

export interface Filters {
  dims: Record<string, string[]>;
  ageMin: number;
  ageMax: number;
  search: string;
}

export const emptyFilters = (): Filters => ({ dims: {}, ageMin: 15, ageMax: 80, search: '' });

export function filterCount(f: Filters): number {
  return Object.values(f.dims).filter((v) => v.length).length + (f.ageMin > 15 || f.ageMax < 80 ? 1 : 0) + (f.search ? 1 : 0);
}

export function applyFilters(rows: Row[], f: Filters, view: View): Row[] {
  const s = f.search.trim().toLowerCase();
  return rows.filter((r) => {
    if (r.p.age < f.ageMin || r.p.age > f.ageMax) return false;
    for (const [id, vals] of Object.entries(f.dims)) {
      if (!vals.length) continue;
      const d = DIM_BY_ID[id];
      if (!d) continue;
      const v = d.get(r.p, answerFor(r, view === 'diff' ? 'A' : view));
      if (!v || !vals.includes(v)) return false;
    }
    if (s) {
      const a = answerFor(r, view === 'diff' ? 'A' : view);
      const hay = [r.p.name, r.p.country, r.p.occupation, r.p.cityTier, a?.first_reaction, a?.quote_zh, a?.deal_breaker, ...(a?.concerns ?? []), ...(a?.attractions ?? [])].join(' ').toLowerCase();
      if (!hay.includes(s)) return false;
    }
    return true;
  });
}

export function dimValues(rows: Row[], dim: Dim, view: View): [string, number][] {
  const m = new Map<string, number>();
  for (const r of rows) {
    const v = dim.get(r.p, answerFor(r, view === 'diff' ? 'A' : view));
    if (v) m.set(v, (m.get(v) ?? 0) + 1);
  }
  return sortKeys(Array.from(m.entries()), dim.order, (x) => x[0], (x) => -x[1]);
}

export interface Retest {
  n: number;
  dTry: number;
  dPay: number;
  dWanting: number;
  choiceAgree: number;
  corrPay: number;
  pairs: { name: string; a: number; b: number }[];
}

function corr(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 3) return NaN;
  const mx = x.reduce((s, v) => s + v, 0) / n;
  const my = y.reduce((s, v) => s + v, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    sxy += (x[i] - mx) * (y[i] - my);
    sxx += (x[i] - mx) ** 2;
    syy += (y[i] - my) ** 2;
  }
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : NaN;
}

export function retest(rows: Row[]): Retest {
  const ps = rows.filter((r) => r.a && r.rt);
  const n = ps.length;
  if (!n) return { n: 0, dTry: NaN, dPay: NaN, dWanting: NaN, choiceAgree: NaN, corrPay: NaN, pairs: [] };
  const avg = (f: (r: Row) => number) => ps.reduce((s, r) => s + f(r), 0) / n;
  return {
    n,
    dTry: avg((r) => Math.abs(r.a!.prob.try - r.rt!.prob.try)),
    dPay: avg((r) => Math.abs(r.a!.prob.pay - r.rt!.prob.pay)),
    dWanting: avg((r) => Math.abs(r.a!.wanting - r.rt!.wanting)),
    choiceAgree: (ps.filter((r) => r.a!.choice === r.rt!.choice).length / n) * 100,
    corrPay: corr(ps.map((r) => r.a!.prob.pay), ps.map((r) => r.rt!.prob.pay)),
    pairs: ps.map((r) => ({ name: r.p.name, a: r.a!.prob.pay, b: r.rt!.prob.pay })),
  };
}

export function histogram(values: number[], lo: number, hi: number, bins: number): { label: string; n: number }[] {
  const w = (hi - lo) / bins;
  const out = Array.from({ length: bins }, (_, i) => ({ label: `${Math.round(lo + i * w)}`, n: 0 }));
  for (const v of values) {
    const i = Math.min(bins - 1, Math.max(0, Math.floor((v - lo) / w)));
    out[i].n++;
  }
  return out;
}

export function fmt(x: number, unit: Metric['unit'] | string, digits?: number): string {
  if (!Number.isFinite(x)) return '—';
  if (unit === '%') return `${x.toFixed(digits ?? 0)}%`;
  if (unit === '元/月') return `¥${x.toFixed(digits ?? (x < 10 ? 1 : 0))}`;
  if (unit === '/10' || unit === '分') return x.toFixed(digits ?? 1);
  return x.toFixed(digits ?? 1);
}

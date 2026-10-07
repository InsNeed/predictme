import type { CostSpec, Detail, Exposure, ModelId, ThinkingLevel, Usage } from './types';

// 元 / 百万 tokens，高峰价。空闲时段为一半。来源：DeepSeek 官方价格页。
export const PRICES: Record<ModelId, { hit: number; miss: number; out: number; label: string }> = {
  'deepseek-flash': { hit: 0.04, miss: 2, out: 8, label: 'V4.1 Flash' },
  'deepseek-v4-pro': { hit: 0.3, miss: 9, out: 27, label: 'V4 Pro' },
  'deepseek-v4-flash-vision-exp': { hit: 0.04, miss: 2, out: 8, label: 'V4 Flash 识图' },
};

export const VISION_MODEL: ModelId = 'deepseek-v4-flash-vision-exp';
export const MAX_IMAGES = 6;
// DeepSeek 按每张图最多 384 tokens 计费。
export const IMAGE_TOKENS = 384;
export const IMAGES_SEEN: Record<Exposure, number> = { glance: 1, store: 3, full: MAX_IMAGES };

export function supportsVision(model: ModelId): boolean {
  return model === VISION_MODEL;
}

export function avgImagesSeen(count: number, mix: Record<Exposure, number>): number {
  const total = mix.glance + mix.store + mix.full || 1;
  return (Object.keys(IMAGES_SEEN) as Exposure[]).reduce((s, k) => s + Math.min(count, IMAGES_SEEN[k]) * (mix[k] / total), 0);
}

export function isPeakNow(d = new Date()): boolean {
  const bj = new Date(d.getTime() + (d.getTimezoneOffset() + 480) * 60000);
  const day = bj.getDay();
  if (day === 0 || day === 6) return false;
  const m = bj.getHours() * 60 + bj.getMinutes();
  return (m >= 540 && m < 720) || (m >= 840 && m < 1080);
}

export function costOf(model: ModelId, u: Usage, peak = isPeakNow()): number {
  const p = PRICES[model];
  const f = peak ? 1 : 0.5;
  return ((u.hit * p.hit + u.miss * p.miss + u.out * p.out) / 1e6) * f;
}

const OUT_BY_DETAIL: Record<Detail, number> = { brief: 650, standard: 1100, deep: 1800 };
const THINK_TOKENS: Record<ThinkingLevel, number> = { off: 0, low: 500, high: 1800, max: 4500 };

export function maxTokensFor(detail: Detail, thinking: ThinkingLevel): number {
  const base = { brief: 1600, standard: 2600, deep: 4000 }[detail];
  const think = { off: 0, low: 3000, high: 10000, max: 24000 }[thinking];
  return base + think;
}

export interface Estimate {
  calls: number;
  perCall: number;
  total: number;
  low: number;
  high: number;
  reportCost: number;
  peak: boolean;
}

export function estimate(cost: CostSpec, variantB: boolean, aspects: number, avgImages = 0): Estimate {
  const peak = isPeakNow();
  const perPersona = (variantB ? 2 : 1) + cost.retestShare;
  const calls = Math.round(cost.sampleSize * perPersona);
  const systemTokens = 1500 + aspects * 30;
  const userTokens = 700 + avgImages * IMAGE_TOKENS;
  const out = OUT_BY_DETAIL[cost.detail] + THINK_TOKENS[cost.thinking];
  const u: Usage = { hit: systemTokens * 0.85, miss: systemTokens * 0.15 + userTokens, out, reasoning: 0 };
  const perCall = costOf(cost.model, u, peak);
  const reportCost = cost.autoReport ? costOf(cost.reportModel, { hit: 0, miss: 9000, out: 3500 + THINK_TOKENS.high, reasoning: 0 }, peak) : 0;
  const total = perCall * calls + reportCost;
  return { calls, perCall, total, low: total * 0.6, high: total * 1.6, reportCost, peak };
}

export function yuan(x: number): string {
  if (x < 0.01) return `¥${x.toFixed(4)}`;
  if (x < 1) return `¥${x.toFixed(3)}`;
  return `¥${x.toFixed(2)}`;
}

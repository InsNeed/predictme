import { applyFilters, buildRows, countBy, countTags, DIMS, groupStats, metricsFor, nps, retest, stats, valuesOf, type Filters, type Row } from './aggregate';
import type { Run } from './types';
import { CHOICE_LABEL, TIMINGS } from './vocab';

const r1 = (x: number) => (Number.isFinite(x) ? Math.round(x * 10) / 10 : null);

export function summarize(run: Run, rows: Row[]) {
  const ms = metricsFor(run.config.aspects.map((a) => a.name));
  const overall: Record<string, unknown> = {};
  for (const m of ms) {
    const s = stats(valuesOf(rows, 'A', m));
    overall[m.label] = { 均值: r1(s.mean), 标准差: r1(s.sd), 中位数: r1(s.median), n: s.n };
  }
  const keyMetrics = ms.filter((m) => ['try', 'pay', 'still', 'choiceThis', 'wanting'].includes(m.id));
  const segments: Record<string, unknown> = {};
  for (const d of DIMS.filter((d) => !d.answerBased && ['domestic', 'group', 'ageBand', 'gender', 'cityTier', 'income', 'history', 'exposure', 'mood', 'peer', 'trait_C', 'trait_O'].includes(d.id))) {
    const byMetric: Record<string, unknown> = {};
    for (const m of keyMetrics) {
      byMetric[m.label] = groupStats(rows, d, 'A', m).filter((g) => g.n >= 3).map((g) => `${g.key}: ${r1(g.s.mean)} (n=${g.n})`);
    }
    segments[d.label] = byMetric;
  }
  let variant: Record<string, unknown> | null = null;
  if (run.config.variantB.enabled) {
    variant = {};
    for (const m of keyMetrics) {
      const s = stats(valuesOf(rows, 'diff', m));
      variant[`${m.label}（B−A，配对）`] = { 均值差: r1(s.mean), 区间: [r1(s.lo), r1(s.hi)], n: s.n };
    }
  }
  const pick = <T,>(arr: T[], k: number) => arr.slice(0, k);
  const withA = rows.filter((r) => r.a);
  const voices = pick(withA.slice().sort((a, b) => b.a!.prob.pay - a.a!.prob.pay), 8)
    .concat(pick(withA.slice().sort((a, b) => a.a!.prob.pay - b.a!.prob.pay), 8))
    .concat(pick(withA.filter((_, i) => i % 7 === 3), 10))
    .map((r) => `${r.p.name}｜${r.p.country}·${r.p.cityTier}｜${r.p.age}岁${r.p.gender}｜${r.p.occupation}｜付费${r.a!.prob.pay}%｜「${r.a!.quote_zh || r.a!.first_reaction}」｜放弃点：${r.a!.deal_breaker || '无'}｜改主意：${r.a!.would_change_mind}`);
  const extra = run.config.question.extraQuestions.filter((q) => q.trim());
  const extraAnswers = extra.map((q, i) => ({ 问题: q, 回答样本: pick(withA.filter((r) => r.a!.extra_answers[i]), 25).map((r) => `${r.p.country}${r.p.age}岁${r.p.occupation}：${r.a!.extra_answers[i]}`) }));
  const rt = retest(rows);
  return {
    样本: { 人设数: rows.length, 有效回答: withA.length },
    总体: overall,
    比较题: countBy(rows, 'A', (a) => CHOICE_LABEL[a.choice]),
    采用时机: countBy(rows, 'A', (a) => a.timing, TIMINGS),
    情绪: countBy(rows, 'A', (a) => a.emotion.primary),
    价格感受: countBy(rows, 'A', (a) => a.wtp.price_feel),
    推荐: nps(rows, 'A'),
    吸引点: countTags(rows, 'A', (a) => a.attractions).slice(0, 12),
    顾虑: countTags(rows, 'A', (a) => a.concerns).slice(0, 12),
    分群: segments,
    版本对比: variant,
    重测: rt.n ? { n: rt.n, 付费概率平均绝对变化: r1(rt.dPay), 试用概率平均绝对变化: r1(rt.dTry), 选择一致率: r1(rt.choiceAgree) } : null,
    原话样本: voices,
    追加问题: extraAnswers,
  };
}

const REPORT_SYSTEM = `你是一位受过决策科学训练的研究员，替产品团队解读一次「语言模型扮演人群」的模拟结果。写作要求：
- 用简体中文，Markdown。用完整句子，少用术语；必要的术语第一次出现时解释。
- 你拿到的是模型扮演的人设的回答，不是真人数据。它至少隔着三层距离：模型和这类真人之间、这类真人和具体某个人之间、嘴上说的和真的做的之间。不要把模拟比例写成转化率、付费率或市场规模。
- 模型扮演的人群，平均数可能接近，但分布偏窄、群体之间的差异和方向常常不可靠；分群差异只能写成「值得用真实数据检验的假设」，并注明样本量。小于 10 人的分组不下结论。
- 概率要写成概率或区间，不写「一定」。有基础率时先从基础率出发，再说模拟结果建议往哪边调。
- 想要、喜欢、坚持用、付钱、续费是不同的事，分开解读。
- 不要编造数据里没有的数字。

报告结构：
## 一句话结论
## 漏斗：从看到到长期付费（逐级解读，指出最大的掉落点）
## 各方面评价（强项、弱项，引用分数）
## 谁更可能、谁不太可能（写成假设，带样本量）
## 主要顾虑与吸引点（结合原话）
## 价格与付费（陈述支付意愿 vs 标价；说和做的缺口方向）
## 情景推演（乐观 / 基准 / 悲观三种走势，各写触发条件和你给的主观概率，三者相加 100%）
## 产品建议（5 条以内，每条对准一个顾虑或掉落点）
## 这次问题还缺什么（参照点、默认值、时间窗、框架、基础率等，哪些没写清）
## 下一步怎么用真实数据验证（具体、便宜的实验）`;

export function reportMessages(run: Run, filters: Filters | null, scope: string) {
  const rows = filters ? applyFilters(buildRows(run), filters, 'A') : buildRows(run);
  const data = summarize(run, rows);
  const p = run.config.product;
  const q = run.config.question;
  const { images: bImages, ...variantB } = run.config.variantB;
  const context = {
    产品: { 名称: p.name, 一句话: p.tagline, 介绍: p.description, 类别: p.category, 形态: p.form, 阶段: p.stage, 定价: `${p.pricingModel} ${p.priceCNY} 元/${p.pricePeriod}${p.priceUSD ? `，海外 ${p.priceUSD} USD` : ''}`, 价格说法: p.priceFraming, 试用: `${p.trialDays} 天，到期${p.trialDefault}，${p.cardForTrial ? '需绑卡' : '不绑卡'}`, 现有替代: p.alternative, 截图张数: p.images?.length ?? 0 },
    对照版本B: variantB.enabled ? { ...variantB, 截图张数: bImages?.length ?? 0 } : null,
    时间窗: q.window,
    外部基础率: { 试用: q.baseRateTry, 付费: q.baseRatePay },
    范围: scope,
  };
  return [
    { role: 'system' as const, content: REPORT_SYSTEM },
    { role: 'user' as const, content: `【研究设定】\n${JSON.stringify(context, null, 1)}\n\n【模拟统计】\n${JSON.stringify(data, null, 1)}\n\n请写报告。` },
  ];
}

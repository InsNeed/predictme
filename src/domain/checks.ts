import type { RunConfig } from './types';

export interface Check {
  label: string;
  ok: boolean | null;
  note: string;
  source: string;
}

// 第五章 Morwitz 等（2007）：意向在这些条件下更能预测购买。
export function morwitzChecks(cfg: RunConfig): Check[] {
  const p = cfg.product;
  const shortWindow = cfg.question.window === '7天' || cfg.question.window === '30天';
  const durable = p.form === '智能硬件' || p.form === '实体商品';
  return [
    { label: '已有产品，而不是新产品', ok: p.stage === '已上线', note: p.stage === '已上线' ? '已上线' : '新产品，意向更难预测购买', source: '第五章' },
    { label: '耐用品', ok: durable, note: durable ? '实体/硬件' : '数字服务通常不算耐用品', source: '第五章' },
    { label: '时间窗短', ok: shortWindow, note: `问的是 ${cfg.question.window} 内`, source: '第五章' },
    { label: '问的是具体品牌/产品', ok: true, note: '问的是这一个产品', source: '第五章' },
    { label: '以首次试用计', ok: null, note: '试用概率比付费概率更接近这一条；两者都报', source: '第五章' },
    { label: '比较式提问', ok: !!p.alternative.trim(), note: p.alternative.trim() ? '比较题里放了现有做法' : '没有写现有替代，比较题只能和「不做」比', source: '第五章' },
  ];
}

// 第四章「人物描述必须能回答的问题」中与题目本身相关的部分。
export function framingChecks(cfg: RunConfig): Check[] {
  const p = cfg.product;
  const hasPrice = p.pricingModel === '完全免费（广告）' || p.priceCNY > 0;
  return [
    { label: '价格写清了', ok: hasPrice, note: hasPrice ? '有标价' : '没有价格，付费概率没有依据', source: '第四章' },
    { label: '价格的说法（框架）写清了', ok: !!p.priceFraming.trim(), note: p.priceFraming.trim() ? `「${p.priceFraming}」` : '页面上价格怎么写会移动选择，建议填写', source: '第三、四章' },
    { label: '参照点（和什么比）写清了', ok: !!p.alternative.trim(), note: p.alternative.trim() ? `现有做法：${p.alternative}` : '缺参照点：30 元相对什么？', source: '第四章' },
    { label: '默认值写清了', ok: p.trialDefault !== '无试用' || p.pricingModel === '买断' || p.pricingModel === '实物售价', note: `试用到期：${p.trialDefault}`, source: '第五章' },
    { label: '时间窗写清了', ok: true, note: cfg.question.window, source: '第五章' },
    { label: '有参照类的基础率', ok: cfg.question.baseRateTry != null || cfg.question.baseRatePay != null, note: cfg.question.baseRatePay != null || cfg.question.baseRateTry != null ? '已填写外部基础率' : '没有基础率，预测的起点是凭空的', source: '第六章' },
    { label: '一次 / 一串分开问', ok: true, note: '首笔、30 天、续费、一年分别问', source: '第一、四、五章' },
    { label: '信息暴露接近真实', ok: cfg.audience.exposureMix.full < 60, note: cfg.audience.exposureMix.full < 60 ? '多数人只看到部分信息' : '多数人读完了全部介绍，可能「知道得太多」', source: '第七章' },
  ];
}

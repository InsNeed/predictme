import { defaultCountryWeights } from './markets';
import type { ProductSpec, RunConfig } from './types';
import { DEFAULT_ASPECTS } from './vocab';

export const EXAMPLES: { id: string; label: string; blurb: string; product: ProductSpec; alt?: Partial<RunConfig['question']> }[] = [
  {
    id: 'habit',
    label: '习惯打卡 App',
    blurb: '教材里林可看的那一类应用',
    product: {
      name: '小步', tagline: '每天勾一下，看见自己在变好', category: '健康健身', form: '手机 App', stage: '即将上线',
      description: '小步帮你每天坚持一件小事：喝水、早睡、读十页书。每天打开勾选一次，连续天数会长成一棵树；每周给你一张小结，告诉你哪天最容易断。可以邀请朋友互相监督，断签时朋友会收到提醒。高级版解锁无限习惯、详细统计和主题皮肤。',
      pricingModel: '订阅制', priceCNY: 18, priceUSD: 3.99, pricePeriod: '月', priceFraming: '每天不到 6 毛钱',
      trialDays: 7, trialDefault: '自动转付费', cardForTrial: true, alternative: '手机备忘录、Keep、纸质日历', storeRating: '新上架，暂无评分',
    },
  },
  {
    id: 'ai-tutor',
    label: 'AI 英语口语陪练',
    blurb: '面向学生和职场人的订阅',
    product: {
      name: 'Speakly', tagline: '一个随时有空、不笑话你的外教', category: '教育学习', form: '手机 App', stage: '已上线',
      description: '和 AI 外教用语音自由聊天，它会纠正发音和语法，模拟面试、点餐、开会等场景，每次 10 分钟。根据你的水平自动调难度，生成每周进步报告。',
      pricingModel: '订阅制', priceCNY: 268, priceUSD: 59.99, pricePeriod: '年', priceFraming: '一年不到一节真人课的钱',
      trialDays: 3, trialDefault: '到期停止', cardForTrial: false, alternative: '真人外教课、英语流利说、看美剧', storeRating: '4.6 分，2 万条评价',
    },
  },
  {
    id: 'cup',
    label: '智能温控水杯',
    blurb: '实体硬件，一次性购买',
    product: {
      name: '暖时 T1', tagline: '一直保持你喜欢的温度', category: '智能硬件', form: '实体商品', stage: '概念',
      description: '355ml 陶瓷内胆智能杯，可设定 50–65℃ 恒温，续航 2 小时，配无线杯垫；App 记录每日饮水量并提醒喝水。',
      pricingModel: '实物售价', priceCNY: 499, priceUSD: 99, pricePeriod: '一次', priceFraming: '',
      trialDays: 0, trialDefault: '无试用', cardForTrial: false, alternative: '普通保温杯、电热水壶', storeRating: '',
    },
  },
];

export function defaultConfig(): RunConfig {
  return {
    product: { ...EXAMPLES[0].product },
    variantB: { enabled: false, label: '版本 B' },
    aspects: DEFAULT_ASPECTS.map((a) => ({ ...a })),
    audience: {
      countryWeights: defaultCountryWeights(),
      ageMin: 16,
      ageMax: 70,
      ageShape: 'adult',
      femaleShare: 0.5,
      exposureMix: { glance: 45, store: 40, full: 15 },
      note: '',
    },
    question: { window: '30天', extraQuestions: [''], baseRateTry: null, baseRatePay: null },
    cost: {
      sampleSize: 60,
      model: 'deepseek-flash',
      thinking: 'off',
      detail: 'standard',
      retestShare: 0.15,
      temperature: 1.0,
      concurrency: 12,
      budgetCNY: 5,
      autoReport: true,
      reportModel: 'deepseek-v4-pro',
    },
    seed: Math.floor(Math.random() * 1e9),
  };
}

export const COST_PRESETS: { id: string; label: string; desc: string; cost: Partial<RunConfig['cost']> }[] = [
  { id: 'peek', label: '试水', desc: '20 人 · Flash · 不思考', cost: { sampleSize: 20, model: 'deepseek-flash', thinking: 'off', detail: 'brief', retestShare: 0, concurrency: 10 } },
  { id: 'std', label: '标准', desc: '100 人 · Flash · 15% 重测', cost: { sampleSize: 100, model: 'deepseek-flash', thinking: 'off', detail: 'standard', retestShare: 0.15, concurrency: 16 } },
  { id: 'deep', label: '深度', desc: '300 人 · Flash · 低思考', cost: { sampleSize: 300, model: 'deepseek-flash', thinking: 'low', detail: 'standard', retestShare: 0.2, concurrency: 30 } },
  { id: 'max', label: '不计成本', desc: '1000 人 · Pro · 高思考', cost: { sampleSize: 1000, model: 'deepseek-v4-pro', thinking: 'high', detail: 'deep', retestShare: 0.3, concurrency: 40 } },
];

export type Exposure = 'glance' | 'store' | 'full';
export type ThinkingLevel = 'off' | 'low' | 'high' | 'max';
export type Detail = 'brief' | 'standard' | 'deep';
export type ModelId = 'deepseek-flash' | 'deepseek-v4-pro';
export type VariantId = 'A' | 'B';
export type CallKind = 'main' | 'retest';

export interface Aspect {
  name: string;
  hint: string;
}

export interface ProductSpec {
  name: string;
  tagline: string;
  description: string;
  category: string;
  form: string;
  stage: '概念' | '即将上线' | '已上线';
  pricingModel: string;
  priceCNY: number;
  priceUSD: number;
  pricePeriod: '月' | '年' | '一次' | '次';
  priceFraming: string;
  trialDays: number;
  trialDefault: '自动转付费' | '到期停止' | '无试用';
  cardForTrial: boolean;
  alternative: string;
  storeRating: string;
}

export interface VariantB {
  enabled: boolean;
  label: string;
  tagline?: string;
  description?: string;
  priceCNY?: number;
  priceUSD?: number;
  pricePeriod?: ProductSpec['pricePeriod'];
  priceFraming?: string;
  trialDefault?: ProductSpec['trialDefault'];
}

export interface AudienceSpec {
  countryWeights: Record<string, number>;
  ageMin: number;
  ageMax: number;
  ageShape: 'uniform' | 'adult';
  femaleShare: number;
  exposureMix: Record<Exposure, number>;
  note: string;
}

export interface CostSpec {
  sampleSize: number;
  model: ModelId;
  thinking: ThinkingLevel;
  detail: Detail;
  retestShare: number;
  temperature: number;
  concurrency: number;
  budgetCNY: number;
  autoReport: boolean;
  reportModel: ModelId;
}

export interface QuestionSpec {
  window: '7天' | '30天' | '90天' | '1年';
  extraQuestions: string[];
  baseRateTry: number | null;
  baseRatePay: number | null;
}

export interface RunConfig {
  product: ProductSpec;
  variantB: VariantB;
  aspects: Aspect[];
  audience: AudienceSpec;
  question: QuestionSpec;
  cost: CostSpec;
  seed: number;
}

export interface Traits {
  O: number;
  C: number;
  E: number;
  A: number;
  ES: number;
  H: number;
}

export interface Persona {
  id: string;
  idx: number;
  name: string;
  countryId: string;
  country: string;
  group: string;
  domestic: boolean;
  diaspora: boolean;
  lang: string;
  cityTier: string;
  age: number;
  ageBand: string;
  gender: '男' | '女';
  occupation: string;
  education: string;
  family: string;
  incomeQuintile: number;
  incomeLabel: string;
  monthlyIncomeLocal: number;
  monthlyIncomeCNY: number;
  currency: string;
  traits: Traits;
  signatures: string[];
  history: string[];
  historyKey: string;
  currentTool: string;
  goals: string[];
  narrative: string;
  mood: string;
  recentEvent: string;
  moment: string;
  channel: string;
  exposure: Exposure;
  peerNorm: string;
  digitalHabit: string;
  payMethods: string;
}

export type Choice = 'this' | 'current' | 'neither';
export type Timing = '马上' | '等身边人用了再说' | '等降价或优惠' | '等更成熟口碑更多' | '不会';

export interface Answer {
  first_reaction: string;
  thinking_steps: string[];
  attention: number;
  clarity: number;
  wanting: number;
  expected_liking: number;
  emotion: { primary: string; intensity: number };
  aspects: Record<string, { s: number; n: string }>;
  choice: Choice;
  choiceReason: string;
  prob: {
    try: number;
    pay: number;
    active_30d: number;
    renew: number;
    still_1y: number;
  };
  recommend: number;
  timing: Timing;
  wtp: { amount: number; currency: string; period: string; price_feel: string; amountCNYMonth: number | null };
  attractions: string[];
  concerns: string[];
  identity_fit: number;
  identity_note: string;
  default_effect: string;
  deal_breaker: string;
  would_change_mind: string;
  self_confidence: number;
  quote: string;
  quote_zh: string;
  extra_answers: string[];
}

export interface Usage {
  hit: number;
  miss: number;
  out: number;
  reasoning: number;
}

export interface CallRecord {
  key: string;
  personaId: string;
  variant: VariantId;
  kind: CallKind;
  status: 'ok' | 'error';
  answer?: Answer;
  reasoning?: string;
  error?: string;
  usage: Usage;
  cost: number;
  ms: number;
  optionOrder: Choice[];
  at: number;
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export type RunStatus = 'draft' | 'running' | 'paused' | 'done' | 'stopped' | 'budget';

export interface Outcome {
  actualTry: number | null;
  actualPay: number | null;
  note: string;
}

export interface Run {
  id: string;
  title: string;
  createdAt: number;
  config: RunConfig;
  personas: Persona[];
  calls: Record<string, CallRecord>;
  chats: Record<string, ChatTurn[]>;
  status: RunStatus;
  spent: number;
  report?: { markdown: string; at: number; cost: number; scope: string };
  outcome?: Outcome;
}

export interface RunMeta {
  id: string;
  title: string;
  createdAt: number;
  status: RunStatus;
  n: number;
  ok: number;
  spent: number;
  payMean: number | null;
  tryMean: number | null;
  outcome?: Outcome;
}

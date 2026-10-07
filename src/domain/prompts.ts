import { COUNTRY_BY_ID } from './markets';
import { levelWord } from './personaGen';
import type { Rng } from './rng';
import type { Answer, Aspect, Choice, Detail, Exposure, Persona, ProductSpec, RunConfig, VariantId } from './types';
import { ATTRACTION_TAGS, CONCERN_TAGS, EMOTIONS, PRICE_FEELS, TIMINGS, TRAIT_LABEL } from './vocab';

export function productFor(cfg: RunConfig, v: VariantId): ProductSpec {
  if (v === 'A' || !cfg.variantB.enabled) return cfg.product;
  const b = cfg.variantB;
  const p = { ...cfg.product };
  if (b.tagline) p.tagline = b.tagline;
  if (b.description) p.description = b.description;
  if (b.priceCNY != null && b.priceCNY > 0) p.priceCNY = b.priceCNY;
  if (b.priceUSD != null && b.priceUSD > 0) p.priceUSD = b.priceUSD;
  if (b.pricePeriod) p.pricePeriod = b.pricePeriod;
  if (b.priceFraming != null && b.priceFraming !== '') p.priceFraming = b.priceFraming;
  if (b.trialDefault) p.trialDefault = b.trialDefault;
  return p;
}

function fmtMoney(x: number, cur: string): string {
  const digits = x >= 100 ? 0 : x >= 10 ? 1 : 2;
  return `${x.toFixed(digits).replace(/\.0+$/, '')} ${cur}`;
}

export function priceShownTo(p: ProductSpec, persona: Persona): string {
  if (p.pricingModel === '完全免费（广告）') return '免费（有广告）';
  const c = COUNTRY_BY_ID[persona.countryId];
  const per = p.pricePeriod === '一次' ? '（一次性）' : `/${p.pricePeriod}`;
  let base: string;
  if (persona.domestic || !p.priceUSD) {
    if (persona.domestic) base = `${fmtMoney(p.priceCNY, '元')}${per}`;
    else base = `${fmtMoney(p.priceCNY / c.fx, c.currency)}${per}（按人民币价换算）`;
  } else {
    const local = (p.priceUSD * 7.1) / c.fx;
    base = c.currency === 'USD' ? `${fmtMoney(p.priceUSD, 'USD')}${per}` : `${fmtMoney(p.priceUSD, 'USD')}${per}，约合 ${fmtMoney(local, c.currency)}`;
  }
  const extra: string[] = [];
  if (p.pricingModel) extra.push(p.pricingModel);
  if (p.priceFraming) extra.push(`页面上的说法：「${p.priceFraming}」`);
  return `${base}${extra.length ? `；${extra.join('；')}` : ''}`;
}

function trialText(p: ProductSpec): string {
  if (p.trialDefault === '无试用' || !p.trialDays) return '没有免费试用。';
  const card = p.cardForTrial ? '试用前要先绑定支付方式' : '试用不用绑卡';
  const end = p.trialDefault === '自动转付费' ? '试用到期后如果什么都不做，会自动开始扣费' : '试用到期后如果什么都不做，会自动停止，需要主动开通才付费';
  return `有 ${p.trialDays} 天免费试用，${card}；${end}。`;
}

function productBlock(p: ProductSpec, exposure: Exposure): string {
  const lines: string[] = [];
  if (exposure === 'glance') {
    lines.push('你只是在屏幕上扫到一眼，只看见了下面这些：');
    lines.push(`- 名字：${p.name}`);
    lines.push(`- 一句话：${p.tagline}`);
    lines.push(`- 类型：${p.category}，${p.form}`);
    lines.push('其他信息你都没有看到。');
  } else if (exposure === 'store') {
    const short = p.description.length > 160 ? `${p.description.slice(0, 160)}……` : p.description;
    lines.push('你点开了它的商店页/落地页，大致浏览了一下，看见了：');
    lines.push(`- 名字：${p.name}`);
    lines.push(`- 一句话：${p.tagline}`);
    lines.push(`- 类型：${p.category}，${p.form}`);
    lines.push(`- 简介（你只看了开头）：${short}`);
    if (p.storeRating) lines.push(`- 评分/口碑：${p.storeRating}`);
    lines.push(`- ${trialText(p)}`);
    lines.push('更细的功能说明你没有读。');
  } else {
    lines.push('你认真读完了它的完整介绍：');
    lines.push(`- 名字：${p.name}`);
    lines.push(`- 一句话：${p.tagline}`);
    lines.push(`- 类型：${p.category}，${p.form}；阶段：${p.stage}`);
    lines.push(`- 完整介绍：${p.description}`);
    if (p.storeRating) lines.push(`- 评分/口碑：${p.storeRating}`);
    lines.push(`- ${trialText(p)}`);
  }
  return lines.join('\n');
}

const DETAIL_GUIDE: Record<Detail, string> = {
  brief: 'thinking_steps 写 3 条，每条不超过 30 字；各 note 不超过 15 字。',
  standard: 'thinking_steps 写 4–6 条，每条不超过 50 字；各 note 不超过 25 字。',
  deep: 'thinking_steps 写 6–9 条，每条可以到 80 字，写出真实的犹豫和来回；各 note 不超过 40 字。',
};

export function buildSystem(cfg: RunConfig, v: VariantId, exposure: Exposure): string {
  const p = productFor(cfg, v);
  const aspects = cfg.aspects.map((a) => `  "${a.name}": {"s": <1-10 的整数>, "n": "<一句理由>"}  // ${a.hint}`).join(',\n');
  const extra = cfg.question.extraQuestions.filter((q) => q.trim());
  return `你在一项消费者模拟研究里扮演一个具体的人。研究者想知道：这个人第一次接触一个产品时，会怎么想、会怎么做。你扮演的人在用户消息里给出。

【扮演规则】
1. 你就是这个人。用 TA 的处境、知识、钱包和说话方式想问题，不要用分析师、产品经理或 AI 的视角，不要替产品着想。
2. 你只知道「你看到的信息」里写的东西。没看到的就是不知道；可以猜，但要像这个人那样猜。不要因为你作为模型知道得多就答得更准、更周全。
3. 人格描述是你相对同龄人的长期倾向，只说明趋势，不决定这一次。这一次的说法和价格写法、你此刻的情绪和处境、身边人的态度、你过去在类似东西上的经历，都可能压过性格。
4. 「想要」「预计用起来会喜欢」「会不会坚持用」「愿不愿意付钱」是不同的事，可以指向不同方向，分开判断。
5. 概率写的是你真的会去做的可能性，不是你嘴上会怎么说。它取决于这个人：正好需要它、手头宽裕、爱尝鲜的人可以很高；不需要、警惕、手头紧的人可以很低。不要为了显得中立都写 50 左右，也不要不分青红皂白地压低或抬高。
6. 付钱要拆开看：第一笔、用起来、续费是三件事。试用到期时默认会发生什么，会决定你什么都不做时的结果。
7. 你写下的理由是你自己以为的理由，可以和真正推动你的东西不一样，这没关系。
8. 不要礼貌性夸奖，也不要刻意挑刺。被打动就说被打动，没兴趣就说没兴趣；同一个产品，不同的人反应本来就差很多。
9. 产品的缺点和优点都要像这个人那样权衡：有的人会被一个缺点劝退，有的人根本不在意它。
10. 只输出一个 JSON 对象，不输出任何其他文字。除 quote 外的所有文字用简体中文写（这是研究记录）；quote 用这个人的母语原话。

【你看到的信息】
${productBlock(p, exposure)}
${p.alternative ? `（研究者备注：这类需求常见的现有做法包括：${p.alternative}。你不一定在用。）` : ''}

【输出 JSON 的结构】字段含义写在 // 后面，输出时不要带注释。
{
"first_reaction": "<看到它的第一反应，一句话，用这个人的口吻>",
"thinking_steps": ["<按真实顺序写你脑子里过的念头：先注意到什么、联想到什么、和什么比较、担心什么、最后怎么决定>"],
"attention": <0-10，会不会停下来多看两眼>,
"clarity": <0-10，看没看懂它是干什么的>,
"wanting": <0-10，此刻有多想要它>,
"expected_liking": <0-10，预计真用起来会有多喜欢>,
"emotion": {"primary": "<从这些里选一个：${EMOTIONS.join('、')}>", "intensity": <0-10>},
"aspects": {
${aspects}
},
"choice": "<选项字母，见用户消息里的比较题>",
"choice_reason": "<一句话>",
"prob": {
  "try": <0-100，在${cfg.question.window}内真的会下载、注册或试用的概率>,
  "pay": <0-100，在${cfg.question.window}内真的会付第一笔钱的概率（免费产品指内购或开会员）>,
  "active_30d": <0-100，假如试用了，一个月后还在用的概率>,
  "renew": <0-100，假如付了第一笔，会续下一期或再次购买的概率>,
  "still_1y": <0-100，一年后还在用或还在付费的概率>
},
"recommend": <0-10，会不会推荐给朋友>,
"timing": "<从这些里选一个：${TIMINGS.join('、')}>",
"wtp": {"amount": <你心里觉得值的价格，数字，没有就写 0>, "currency": "<货币代码，如 CNY、USD、JPY>", "period": "<月、年、一次 之一>", "price_feel": "<对标价的感受，从这些里选一个：${PRICE_FEELS.join('、')}>"},
"attractions": ["<吸引你的点，1-3 个短标签，优先从这些里选：${ATTRACTION_TAGS.join('、')}；也可以自己写，不超过 6 个字>"],
"concerns": ["<顾虑，1-3 个短标签，优先从这些里选：${CONCERN_TAGS.join('、')}；也可以自己写，不超过 6 个字>"],
"identity_fit": <-5 到 5，-5 = 完全不像我会用的东西，5 = 太像我了>,
"identity_note": "<一句话>",
"default_effect": "<按你的习惯，试用到期或第一期结束时，实际最可能发生什么>",
"deal_breaker": "<让你直接放弃的那一点，没有就写空字符串>",
"would_change_mind": "<什么情况会让你改变主意>",
"self_confidence": <0-100，你对上面这些判断有多确定>,
"quote": "<用母语说一句你会对朋友说的、关于它的原话>",
"quote_zh": "<quote 的简体中文意思；母语是中文就照抄>"${extra.length ? `,\n"extra_answers": [${extra.map((q, i) => `"<第 ${i + 1} 题：${q.replace(/"/g, '\'')}>"`).join(', ')}]` : ''}
}

【篇幅】${DETAIL_GUIDE[cfg.cost.detail]}`;
}

const CHOICE_TEXT = (p: ProductSpec, persona: Persona): Record<Choice, string> => ({
  this: `开始用「${p.name}」`,
  current: persona.currentTool.startsWith('目前用') ? `继续用我现在的办法（${persona.currentTool.replace(/^目前用/, '').replace(/解决这件事$/, '')}）` : '继续用我现在的老办法',
  neither: '这件事我不打算专门花心思处理',
});

export function personaCard(persona: Persona): string {
  const t = persona.traits;
  const traitLines = (Object.keys(TRAIT_LABEL) as (keyof typeof TRAIT_LABEL)[])
    .map((k) => `${TRAIT_LABEL[k]}${levelWord(t[k])}同龄人（约第 ${t[k]} 百分位）`)
    .join('；');
  const where = persona.domestic ? `${persona.country}·${persona.cityTier}` : `${persona.country}·${persona.cityTier}${persona.diaspora ? '，华人' : ''}`;
  const income = persona.occupation === '学生' ? `每月可支配的生活费约 ${persona.monthlyIncomeLocal} ${persona.currency}` : `月收入约 ${persona.monthlyIncomeLocal} ${persona.currency}（在当地属于${persona.incomeLabel}水平）`;
  return `【你是谁】
${persona.name}，${persona.gender}，${persona.age} 岁，住在${where}。母语：${persona.lang}。
职业：${persona.occupation}；学历：${persona.education}；家庭：${persona.family}。
${income}。常用支付方式：${persona.payMethods}。
用手机的习惯：${persona.digitalHabit}。

【长期倾向（相对同龄人，只是趋势）】
${traitLines}。
你的一些「如果……就……」习惯：
${persona.signatures.map((s) => `- ${s}`).join('\n')}

【你在这类事情上的经历】
${persona.history.map((s) => `- ${s}`).join('\n')}
- ${persona.currentTool}

【你在意什么】
目标：${persona.goals.join('；')}。
你对自己的看法：${persona.narrative}。

【身边的人】
${persona.peerNorm}。

【此刻】
${persona.moment}，心情${persona.mood}；${persona.recentEvent}。
你是通过「${persona.channel}」看到它的。`;
}

export interface BuiltUser {
  text: string;
  order: Choice[];
}

export function buildUser(cfg: RunConfig, v: VariantId, persona: Persona, rng: Rng, retestOf?: Choice[], fixedOrder?: Choice[]): BuiltUser {
  const p = productFor(cfg, v);
  const order: Choice[] = fixedOrder ?? (retestOf ? retestOf.slice().reverse() : rng.shuffle<Choice>(['this', 'current', 'neither']));
  const texts = CHOICE_TEXT(p, persona);
  const letters = ['A', 'B', 'C'];
  const question = retestOf
    ? `接下来${cfg.question.window}里，下面三种做法你最可能是哪一种？`
    : `如果只能选一个，接下来${cfg.question.window}里你最可能怎么做？`;
  const extra = cfg.question.extraQuestions.filter((q) => q.trim());
  const text = `${personaCard(persona)}

【你看到的价格】
${priceShownTo(p, persona)}

【比较题】${question}
${order.map((c, i) => `${letters[i]}. ${texts[c]}`).join('\n')}
choice 字段只填字母。
${extra.length ? `\n【研究者追加的问题】请写进 extra_answers，用这个人的口吻：\n${extra.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n` : ''}
现在以 ${persona.name} 的身份输出 JSON。`;
  return { text, order };
}

const num = (x: unknown, lo: number, hi: number, d: number) => {
  const n = typeof x === 'number' ? x : parseFloat(String(x));
  if (!Number.isFinite(n)) return d;
  return Math.max(lo, Math.min(hi, n));
};
const str = (x: unknown) => (typeof x === 'string' ? x.trim() : x == null ? '' : String(x));
const strArr = (x: unknown, max = 6) => (Array.isArray(x) ? x.map(str).filter(Boolean).slice(0, max) : typeof x === 'string' && x ? [x] : []);

const FX_GUESS: Record<string, number> = {
  CNY: 1, RMB: 1, USD: 7.1, HKD: 0.92, TWD: 0.22, NTD: 0.22, JPY: 0.048, KRW: 0.0052, EUR: 7.7, GBP: 9.0, SGD: 5.3, IDR: 0.00045, VND: 0.00028, INR: 0.085, BRL: 1.3, MXN: 0.39, AED: 1.93, AUD: 4.7, CAD: 5.2,
};

export function normalizeAnswer(raw: unknown, order: Choice[], aspects: Aspect[]): Answer {
  const r = (raw ?? {}) as Record<string, any>;
  const letter = str(r.choice).toUpperCase().replace(/[^ABC]/g, '').slice(0, 1);
  const idx = letter ? letter.charCodeAt(0) - 65 : -1;
  const choice: Choice = idx >= 0 && idx < order.length ? order[idx] : 'neither';
  const aspectOut: Answer['aspects'] = {};
  const ra = (r.aspects ?? {}) as Record<string, any>;
  for (const a of aspects) {
    const item = ra[a.name];
    if (item == null) continue;
    if (typeof item === 'number') aspectOut[a.name] = { s: num(item, 1, 10, 5), n: '' };
    else aspectOut[a.name] = { s: num(item.s ?? item.score, 1, 10, 5), n: str(item.n ?? item.note) };
  }
  const prob = (r.prob ?? {}) as Record<string, any>;
  const wtp = (r.wtp ?? {}) as Record<string, any>;
  const cur = str(wtp.currency).toUpperCase() || 'CNY';
  const amount = num(wtp.amount, 0, 1e9, 0);
  const period = str(wtp.period);
  let amountCNYMonth: number | null = null;
  if (amount > 0 && FX_GUESS[cur] != null) {
    const cny = amount * FX_GUESS[cur];
    amountCNYMonth = period.includes('年') ? cny / 12 : period.includes('一次') || period.includes('次') ? null : cny;
  }
  const timing = TIMINGS.includes(str(r.timing) as any) ? (str(r.timing) as Answer['timing']) : '不会';
  const emo = str(r.emotion?.primary ?? r.emotion);
  return {
    first_reaction: str(r.first_reaction),
    thinking_steps: strArr(r.thinking_steps, 12),
    attention: num(r.attention, 0, 10, 5),
    clarity: num(r.clarity, 0, 10, 5),
    wanting: num(r.wanting, 0, 10, 5),
    expected_liking: num(r.expected_liking, 0, 10, 5),
    emotion: { primary: EMOTIONS.includes(emo) ? emo : emo || '无感', intensity: num(r.emotion?.intensity, 0, 10, 5) },
    aspects: aspectOut,
    choice,
    choiceReason: str(r.choice_reason),
    prob: {
      try: num(prob.try, 0, 100, 0),
      pay: num(prob.pay, 0, 100, 0),
      active_30d: num(prob.active_30d, 0, 100, 0),
      renew: num(prob.renew, 0, 100, 0),
      still_1y: num(prob.still_1y, 0, 100, 0),
    },
    recommend: num(r.recommend, 0, 10, 5),
    timing,
    wtp: { amount, currency: cur, period, price_feel: str(wtp.price_feel), amountCNYMonth },
    attractions: strArr(r.attractions, 4),
    concerns: strArr(r.concerns, 4),
    identity_fit: num(r.identity_fit, -5, 5, 0),
    identity_note: str(r.identity_note),
    default_effect: str(r.default_effect),
    deal_breaker: str(r.deal_breaker),
    would_change_mind: str(r.would_change_mind),
    self_confidence: num(r.self_confidence, 0, 100, 50),
    quote: str(r.quote),
    quote_zh: str(r.quote_zh),
    extra_answers: strArr(r.extra_answers, 5),
  };
}

export function interviewSystem(cfg: RunConfig, v: VariantId, persona: Persona): string {
  return `${buildSystem(cfg, v, persona.exposure).split('【输出 JSON 的结构】')[0]}
【现在】问卷已经答完。研究者在追问你。继续以这个人的身份、口吻和知识水平自然地回答，用简体中文，口语化，一般 1–4 句话。不要输出 JSON，不要跳出角色，不要分析自己。不知道的就说不知道。`;
}

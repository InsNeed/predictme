import { COUNTRY_BY_ID, COUNTRIES } from './markets';
import { makeRng, normCdf, type Rng } from './rng';
import type { AudienceSpec, Exposure, Persona, ProductSpec, Traits } from './types';
import {
  ageBand, CHANNELS, DIGITAL_HABITS, GOALS, HISTORIES, INCOME_LABELS, MOMENTS, MOODS, NARRATIVES,
  OCCUPATIONS, PEER_NORMS, RECENT_EVENTS, SIGNATURES, weightOf,
} from './vocab';

const DIASPORA_SURNAMES = ['Chen', 'Wang', 'Li', 'Zhang', 'Liu', 'Lin', 'Huang', 'Wu'];
const RURAL_HINTS = ['农村', '乡村', '县城', '郊区小镇', '县市乡镇'];

function sampleAge(rng: Rng, a: AudienceSpec): number {
  const lo = Math.max(15, Math.min(a.ageMin, a.ageMax));
  const hi = Math.min(80, Math.max(a.ageMin, a.ageMax));
  if (a.ageShape === 'uniform') return rng.int(lo, hi);
  const items: [number, number][] = [];
  for (let x = lo; x <= hi; x++) {
    const w = x < 20 ? 0.8 : x < 60 ? 1.0 - (x - 20) * 0.004 : 0.84 - (x - 60) * 0.03;
    items.push([x, Math.max(0.1, w)]);
  }
  return rng.weighted(items);
}

function traitPercentile(rng: Rng): number {
  return Math.round(normCdf(rng.normal()) * 98 + 1);
}

function family(rng: Rng, age: number): string {
  if (age < 22) return rng.weighted([['单身', 70], ['恋爱中', 30]]);
  if (age < 30) return rng.weighted([['单身', 40], ['恋爱中', 28], ['已婚无孩', 18], ['已婚有孩', 14]]);
  if (age < 45) return rng.weighted([['单身', 14], ['已婚无孩', 14], ['已婚有孩', 62], ['离异', 10]]);
  if (age < 65) return rng.weighted([['已婚，孩子已大', 62], ['已婚有孩', 14], ['离异', 12], ['单身', 6], ['丧偶', 6]]);
  return rng.weighted([['已婚，孩子已成家', 64], ['丧偶', 26], ['离异', 6], ['单身', 4]]);
}

function exposureOf(rng: Rng, mix: Record<Exposure, number>): Exposure {
  return rng.weighted([['glance', mix.glance], ['store', mix.store], ['full', mix.full]]);
}

function currentToolFor(rng: Rng, product: ProductSpec, digital: string): string {
  const alt = product.alternative.split(/[，,、/]/).map((s) => s.trim()).filter(Boolean);
  const options: [string, number][] = alt.map((a) => [`目前用「${a}」解决这件事`, 3]);
  options.push(['目前没用任何东西专门解决这件事', digital.startsWith('只会') ? 6 : 3]);
  options.push(['靠自己的老办法（纸笔、记在脑子里、问人）', 2]);
  return rng.weighted(options);
}

export function generatePersonas(n: number, audience: AudienceSpec, product: ProductSpec, seed: number): Persona[] {
  const rng = makeRng(seed);
  const countryItems = COUNTRIES.map((c) => [c.id, audience.countryWeights[c.id] ?? 0] as [string, number]).filter(([, w]) => w > 0);
  if (countryItems.length === 0) countryItems.push(['CN', 1]);
  const out: Persona[] = [];
  const usedNames = new Set<string>();
  for (let i = 0; i < n; i++) {
    const c = COUNTRY_BY_ID[rng.weighted(countryItems)];
    const gender: '男' | '女' = rng.chance(audience.femaleShare) ? '女' : '男';
    const age = sampleAge(rng, audience);
    const [tier, , tierMult] = rng.weighted(c.tiers.map((t) => [t, t[1]] as [typeof t, number]));
    const rural = RURAL_HINTS.some((h) => tier.includes(h));
    const occ = rng.weighted(OCCUPATIONS.map((o) => [o, o.w(age, rural)] as [typeof o, number]).filter(([, w]) => w > 0));
    const education = rng.pick(occ.edu);
    const quintile = rng.int(1, 5);
    const qMult = [0.35, 0.65, 1.0, 1.6, 3.0][quintile - 1];
    const occMult = occ.v === '学生' ? 0.25 : occ.v === '退休' ? 0.6 : occ.v === '待业/找工作中' ? 0.2 : occ.v === '全职照顾家庭' ? 0.3 : 1;
    const income = Math.round((c.medianIncome * tierMult * qMult * occMult * Math.exp(rng.normal() * 0.15)) / (c.medianIncome > 100000 ? 1000 : 10)) * (c.medianIncome > 100000 ? 1000 : 10);
    const traits: Traits = { O: traitPercentile(rng), C: traitPercentile(rng), E: traitPercentile(rng), A: traitPercentile(rng), ES: traitPercentile(rng), H: traitPercentile(rng) };

    const diaspora = !c.domestic && rng.chance(c.diaspora);
    let name = '';
    for (let tries = 0; tries < 8 && (!name || usedNames.has(name)); tries++) {
      const surname = diaspora && c.nameOrder === 'given-first' && c.diaspora < 0.5 ? rng.pick(DIASPORA_SURNAMES) : rng.pick(c.surnames);
      const given = rng.pick(gender === '女' ? c.female : c.male);
      name = c.nameOrder === 'family-first' ? `${surname}${given}` : `${given} ${surname}`;
    }
    usedNames.add(name);

    const sigItems = weightOf(SIGNATURES, traits, age);
    const signatures: string[] = [];
    while (signatures.length < 3) {
      const s = rng.weighted(sigItems);
      if (!signatures.includes(s)) signatures.push(s);
    }
    const histItems = HISTORIES.map((h) => [h, h.w(age, c.domestic)] as [typeof h, number]);
    const h1 = rng.weighted(histItems);
    const history = [h1.v];
    if (rng.chance(0.45)) {
      const h2 = rng.weighted(histItems.filter(([h]) => h.key !== h1.key));
      history.push(h2.v);
    }
    const digitalHabit = age > 60 ? rng.weighted([[DIGITAL_HABITS[2], 6], [DIGITAL_HABITS[1], 4], [DIGITAL_HABITS[0], 1]])
      : age < 30 ? rng.weighted([[DIGITAL_HABITS[0], 6], [DIGITAL_HABITS[1], 4], [DIGITAL_HABITS[2], 0.4]])
      : rng.weighted([[DIGITAL_HABITS[0], 3], [DIGITAL_HABITS[1], 6], [DIGITAL_HABITS[2], 1.2]]);

    const incomeLabel = INCOME_LABELS[quintile - 1];
    out.push({
      id: `p${String(i + 1).padStart(4, '0')}`,
      idx: i,
      name,
      countryId: c.id,
      country: c.name,
      group: c.group,
      domestic: c.domestic,
      diaspora,
      lang: diaspora && c.id !== 'HK' && c.id !== 'TW' ? `${c.lang}（华人，也懂中文）` : c.lang,
      cityTier: tier,
      age,
      ageBand: ageBand(age),
      gender,
      occupation: occ.v,
      education,
      family: family(rng, age),
      incomeQuintile: quintile,
      incomeLabel,
      monthlyIncomeLocal: income,
      monthlyIncomeCNY: Math.round(income * c.fx),
      currency: c.currency,
      traits,
      signatures,
      history,
      historyKey: h1.key,
      currentTool: currentToolFor(rng, product, digitalHabit),
      goals: rng.sample(GOALS, rng.chance(0.5) ? 2 : 1),
      narrative: rng.weighted(weightOf(NARRATIVES, traits, age)),
      mood: rng.weighted(MOODS),
      recentEvent: rng.weighted(RECENT_EVENTS),
      moment: rng.weighted(MOMENTS),
      channel: rng.weighted(CHANNELS),
      exposure: exposureOf(rng, audience.exposureMix),
      peerNorm: rng.weighted(PEER_NORMS),
      digitalHabit,
      payMethods: c.pay,
    });
  }
  return out;
}

export function levelWord(p: number): string {
  if (p >= 85) return '明显高于';
  if (p >= 65) return '略高于';
  if (p > 35) return '接近';
  if (p > 15) return '略低于';
  return '明显低于';
}

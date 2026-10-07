import { Card } from '@/components/ui';
import { framingChecks, morwitzChecks } from '@/domain/checks';
import { COUNTRY_BY_ID } from '@/domain/markets';
import { PRICES } from '@/domain/pricing';
import { productFor } from '@/domain/prompts';
import type { Run } from '@/domain/types';
import { EXPOSURE_LABEL } from '@/domain/vocab';

export function Setup({ run }: { run: Run }) {
  const c = run.config;
  const p = c.product;
  const pb = productFor(c, 'B');
  const counts = new Map<string, number>();
  run.personas.forEach((x) => counts.set(x.countryId, (counts.get(x.countryId) ?? 0) + 1));
  const checks = [...framingChecks(c), ...morwitzChecks(c)];
  return (
    <div className="grid g2">
      <Card title="产品与问法">
        <div className="kv">
          <span>名字</span><span><b>{p.name}</b></span>
          <span>一句话</span><span>{p.tagline}</span>
          <span>介绍</span><span className="small">{p.description}</span>
          <span>类别 / 形态</span><span>{p.category} · {p.form} · {p.stage}</span>
          <span>定价</span><span>{p.pricingModel} · ¥{p.priceCNY}/{p.pricePeriod}{p.priceUSD ? ` · $${p.priceUSD}` : ''}</span>
          <span>价格说法</span><span>{p.priceFraming || '—'}</span>
          <span>试用</span><span>{p.trialDays} 天 · 到期{p.trialDefault} · {p.cardForTrial ? '需绑卡' : '不绑卡'}</span>
          <span>现有替代</span><span>{p.alternative || '—'}</span>
          <span>时间窗</span><span>{c.question.window}</span>
          <span>基础率</span><span>试用 {c.question.baseRateTry ?? '—'}% · 付费 {c.question.baseRatePay ?? '—'}%</span>
        </div>
        {c.variantB.enabled && (
          <>
            <div className="hr" />
            <h4>{c.variantB.label || '版本 B'}</h4>
            <div className="kv mt8">
              <span>一句话</span><span>{pb.tagline}</span>
              <span>定价</span><span>¥{pb.priceCNY}/{pb.pricePeriod}{pb.priceUSD ? ` · $${pb.priceUSD}` : ''}</span>
              <span>价格说法</span><span>{pb.priceFraming || '—'}</span>
              <span>试用到期</span><span>{pb.trialDefault}</span>
            </div>
          </>
        )}
      </Card>
      <Card title="人群与成本">
        <div className="kv">
          <span>样本</span><span>{run.personas.length} 人 · 年龄 {c.audience.ageMin}–{c.audience.ageMax} · 女性 {(c.audience.femaleShare * 100).toFixed(0)}%</span>
          <span>地区</span><span>{Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).map(([id, n]) => <span key={id} className="tag">{COUNTRY_BY_ID[id].name} {n}</span>)}</span>
          <span>信息暴露</span><span>{(Object.keys(EXPOSURE_LABEL) as (keyof typeof EXPOSURE_LABEL)[]).map((k) => `${EXPOSURE_LABEL[k]} ${c.audience.exposureMix[k]}`).join(' · ')}</span>
          <span>模型</span><span>{PRICES[c.cost.model].label} · 思考 {c.cost.thinking} · 篇幅 {c.cost.detail} · 温度 {c.cost.temperature}</span>
          <span>重测</span><span>{(c.cost.retestShare * 100).toFixed(0)}%</span>
          <span>评价维度</span><span>{c.aspects.map((a) => <span key={a.name} className="tag">{a.name}</span>)}</span>
          <span>追加问题</span><span>{c.question.extraQuestions.filter((q) => q.trim()).join('；') || '—'}</span>
          <span>随机种子</span><span className="num">{c.seed}</span>
        </div>
      </Card>
      <Card title="题目核对" className="span2">
        <div className="grid g2">
          {checks.map((x) => (
            <div key={x.label} className="check">
              <span className={`mark ${x.ok === true ? 'ok' : x.ok === false ? 'no' : 'na'}`}>{x.ok === true ? '✓' : x.ok === false ? '✕' : '·'}</span>
              <div><div>{x.label} <span className="tiny muted">{x.source}</span></div><div className="tiny muted">{x.note}</div></div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

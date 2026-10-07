import { useEffect, useMemo, useState } from 'react';
import { Card, Field, Seg, SliderRow } from '@/components/ui';
import { framingChecks, morwitzChecks, type Check } from '@/domain/checks';
import { COST_PRESETS, EXAMPLES } from '@/domain/defaults';
import { AUDIENCE_PRESETS, COUNTRIES, GROUPS } from '@/domain/markets';
import { generatePersonas } from '@/domain/personaGen';
import { estimate, PRICES, yuan } from '@/domain/pricing';
import { buildSystem, buildUser } from '@/domain/prompts';
import { makeRng } from '@/domain/rng';
import { go } from '@/app/router';
import { getRunner, registerRun } from '@/state/runs';
import { loadDraft, saveDraft } from '@/storage/settings';
import type { Exposure, Persona, RunConfig } from '@/domain/types';
import { CATEGORIES, DEFAULT_ASPECTS, EXPOSURE_LABEL, FORMS, PRICING_MODELS } from '@/domain/vocab';

function CheckList({ items }: { items: Check[] }) {
  return (
    <div>
      {items.map((c) => (
        <div className="check" key={c.label}>
          <span className={`mark ${c.ok === true ? 'ok' : c.ok === false ? 'no' : 'na'}`}>{c.ok === true ? '✓' : c.ok === false ? '✕' : '·'}</span>
          <div>
            <div>{c.label} <span className="tiny muted">{c.source}</span></div>
            <div className="tiny muted">{c.note}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function NewRun() {
  const [cfg, setCfg] = useState<RunConfig>(loadDraft);
  const [preview, setPreview] = useState<Persona[] | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    saveDraft(cfg);
  }, [cfg]);

  const p = cfg.product;
  const setP = (patch: Partial<RunConfig['product']>) => setCfg((c) => ({ ...c, product: { ...c.product, ...patch } }));
  const setA = (patch: Partial<RunConfig['audience']>) => setCfg((c) => ({ ...c, audience: { ...c.audience, ...patch } }));
  const setQ = (patch: Partial<RunConfig['question']>) => setCfg((c) => ({ ...c, question: { ...c.question, ...patch } }));
  const setC = (patch: Partial<RunConfig['cost']>) => setCfg((c) => ({ ...c, cost: { ...c.cost, ...patch } }));
  const setB = (patch: Partial<RunConfig['variantB']>) => setCfg((c) => ({ ...c, variantB: { ...c.variantB, ...patch } }));

  const est = useMemo(() => estimate(cfg.cost, cfg.variantB.enabled, cfg.aspects.length), [cfg.cost, cfg.variantB.enabled, cfg.aspects.length]);
  const checks = useMemo(() => ({ m: morwitzChecks(cfg), f: framingChecks(cfg) }), [cfg]);
  const totalW = Object.values(cfg.audience.countryWeights).reduce((s, x) => s + x, 0) || 1;
  const domesticShare = (cfg.audience.countryWeights.CN ?? 0) / totalW;
  const expTotal = cfg.audience.exposureMix.glance + cfg.audience.exposureMix.store + cfg.audience.exposureMix.full || 1;

  function doPreview() {
    setPreview(generatePersonas(Math.min(6, cfg.cost.sampleSize), cfg.audience, cfg.product, cfg.seed));
  }

  async function start() {
    if (!p.name.trim() || !p.tagline.trim()) {
      alert('请至少填写产品名字和一句话介绍');
      return;
    }
    setStarting(true);
    const personas = generatePersonas(cfg.cost.sampleSize, cfg.audience, cfg.product, cfg.seed);
    const id = `r${Date.now().toString(36)}`;
    const run = {
      id, title: `${p.name}${cfg.variantB.enabled ? ' · A/B' : ''} · ${cfg.cost.sampleSize} 人`, createdAt: Date.now(),
      config: JSON.parse(JSON.stringify(cfg)) as RunConfig, personas, calls: {}, chats: {}, status: 'draft' as const, spent: 0,
    };
    await registerRun(run);
    getRunner(run).start();
    setCfg((c) => ({ ...c, seed: Math.floor(Math.random() * 1e9) }));
    go(`/run/${id}`);
  }

  const promptSample = useMemo(() => {
    if (!showPrompt || !preview?.length) return null;
    const persona = preview[0];
    return { sys: buildSystem(cfg, 'A', persona.exposure), user: buildUser(cfg, 'A', persona, makeRng(1)).text };
  }, [showPrompt, preview, cfg]);

  return (
    <div>
      <div className="hero" style={{ marginBottom: 22 }}>
        <div className="eyebrow">NEW FORECAST</div>
        <h1>让一群「人」先看一眼你的产品</h1>
        <p className="muted mt8" style={{ maxWidth: 720 }}>
          写下产品和定价，选好人群和预算。每个模拟人设有自己的处境、经历和此刻的心情，分开回答想不想要、会不会试、会不会付第一笔、会不会坚持和续费，并写下思考过程。结果是模型对「这类人会怎么说」的估计，适合比较版本、找出顾虑和问题缺口，不是付费率。
        </p>
        <div className="example-cards mt16">
          {EXAMPLES.map((e) => (
            <div key={e.id} className="example" onClick={() => setCfg((c) => ({ ...c, product: { ...e.product } }))}>
              <b>{e.label}</b>
              <span className="muted">{e.blurb} · 点击填入</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 340px', alignItems: 'start' }}>
        <div className="col gap16">
          <Card>
            <div className="step-title"><span className="step-no">01</span><h2>产品</h2></div>
            <div className="form-grid">
              <Field label="名字" className="c4"><input type="text" value={p.name} onChange={(e) => setP({ name: e.target.value })} /></Field>
              <Field label="一句话介绍" hint="只扫一眼的人只看到这句" className="c8"><input type="text" value={p.tagline} onChange={(e) => setP({ tagline: e.target.value })} /></Field>
              <Field label="完整介绍" hint="读完介绍的人才看得到全部；看商店页的人只看到前 160 字" className="c12">
                <textarea rows={4} value={p.description} onChange={(e) => setP({ description: e.target.value })} />
              </Field>
              <Field label="类别" className="c4"><select value={p.category} onChange={(e) => setP({ category: e.target.value })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
              <Field label="形态" className="c4"><select value={p.form} onChange={(e) => setP({ form: e.target.value })}>{FORMS.map((c) => <option key={c}>{c}</option>)}</select></Field>
              <Field label="阶段" className="c4"><select value={p.stage} onChange={(e) => setP({ stage: e.target.value as RunConfig['product']['stage'] })}>{['概念', '即将上线', '已上线'].map((c) => <option key={c}>{c}</option>)}</select></Field>
              <Field label="评分 / 口碑" hint="看商店页及以上的人能看到" className="c6"><input type="text" value={p.storeRating} onChange={(e) => setP({ storeRating: e.target.value })} placeholder="例如：4.6 分，2 万条评价" /></Field>
              <Field label="现有替代做法" hint="比较题的参照点，用逗号分隔" className="c6"><input type="text" value={p.alternative} onChange={(e) => setP({ alternative: e.target.value })} placeholder="例如：手机备忘录、Keep" /></Field>
            </div>
          </Card>

          <Card>
            <div className="step-title"><span className="step-no">02</span><h2>定价与问法</h2><span className="muted small">这一次的说法和默认值，常常比性格更能移动选择（第三、五章）</span></div>
            <div className="form-grid">
              <Field label="收费方式" className="c4"><select value={p.pricingModel} onChange={(e) => setP({ pricingModel: e.target.value })}>{PRICING_MODELS.map((c) => <option key={c}>{c}</option>)}</select></Field>
              <Field label="国内价格（元）" className="c3"><input type="number" value={p.priceCNY} onChange={(e) => setP({ priceCNY: parseFloat(e.target.value) || 0 })} /></Field>
              <Field label="海外价格（USD）" hint="留 0 则按汇率换算" className="c3"><input type="number" value={p.priceUSD} onChange={(e) => setP({ priceUSD: parseFloat(e.target.value) || 0 })} /></Field>
              <Field label="周期" className="c2" ><select value={p.pricePeriod} onChange={(e) => setP({ pricePeriod: e.target.value as RunConfig['product']['pricePeriod'] })}>{['月', '年', '一次', '次'].map((c) => <option key={c}>{c}</option>)}</select></Field>
              <Field label="页面上价格的说法" hint="框架，例如「每天不到 6 毛」「一年省下 300 元」" className="c6"><input type="text" value={p.priceFraming} onChange={(e) => setP({ priceFraming: e.target.value })} /></Field>
              <Field label="免费试用天数" className="c2"><input type="number" value={p.trialDays} onChange={(e) => setP({ trialDays: parseInt(e.target.value) || 0 })} /></Field>
              <Field label="试用到期默认" className="c4"><select value={p.trialDefault} onChange={(e) => setP({ trialDefault: e.target.value as RunConfig['product']['trialDefault'] })}>{['自动转付费', '到期停止', '无试用'].map((c) => <option key={c}>{c}</option>)}</select></Field>
              <label className="check c4" style={{ alignSelf: 'end' }}><input type="checkbox" checked={p.cardForTrial} onChange={(e) => setP({ cardForTrial: e.target.checked })} /> 试用前要绑卡</label>
              <Field label="问的时间窗" className="c4">
                <Seg value={cfg.question.window} options={(['7天', '30天', '90天', '1年'] as const).map((v) => ({ v, l: v }))} onChange={(v) => setQ({ window: v })} />
              </Field>
              <Field label="参照类基础率 · 试用 %" hint="同类产品真实的试用比例，知道就填" className="c4"><input type="number" value={cfg.question.baseRateTry ?? ''} onChange={(e) => setQ({ baseRateTry: e.target.value === '' ? null : parseFloat(e.target.value) })} placeholder="不知道就留空" /></Field>
              <Field label="参照类基础率 · 付费 %" className="c4"><input type="number" value={cfg.question.baseRatePay ?? ''} onChange={(e) => setQ({ baseRatePay: e.target.value === '' ? null : parseFloat(e.target.value) })} placeholder="不知道就留空" /></Field>
            </div>
          </Card>

          <Card>
            <div className="step-title"><span className="step-no">03</span><h2>对照版本 B</h2><span className="muted small">同一批人分别看 A 和 B，比较配对差值，这是最站得住的用法</span></div>
            <label className="check"><input type="checkbox" checked={cfg.variantB.enabled} onChange={(e) => setB({ enabled: e.target.checked })} /> 开启对照版本（调用次数翻倍；只填你要改的那几项）</label>
            {cfg.variantB.enabled && (
              <div className="form-grid mt8">
                <Field label="版本名" className="c4"><input type="text" value={cfg.variantB.label} onChange={(e) => setB({ label: e.target.value })} /></Field>
                <Field label="一句话介绍" className="c8"><input type="text" value={cfg.variantB.tagline ?? ''} onChange={(e) => setB({ tagline: e.target.value })} placeholder={p.tagline} /></Field>
                <Field label="国内价格（元）" className="c3"><input type="number" value={cfg.variantB.priceCNY ?? ''} onChange={(e) => setB({ priceCNY: e.target.value === '' ? undefined : parseFloat(e.target.value) })} placeholder={String(p.priceCNY)} /></Field>
                <Field label="海外价格（USD）" className="c3"><input type="number" value={cfg.variantB.priceUSD ?? ''} onChange={(e) => setB({ priceUSD: e.target.value === '' ? undefined : parseFloat(e.target.value) })} placeholder={String(p.priceUSD)} /></Field>
                <Field label="周期" className="c2"><select value={cfg.variantB.pricePeriod ?? ''} onChange={(e) => setB({ pricePeriod: (e.target.value || undefined) as RunConfig['product']['pricePeriod'] })}><option value="">同 A</option>{['月', '年', '一次', '次'].map((c) => <option key={c}>{c}</option>)}</select></Field>
                <Field label="试用到期默认" className="c4"><select value={cfg.variantB.trialDefault ?? ''} onChange={(e) => setB({ trialDefault: (e.target.value || undefined) as RunConfig['product']['trialDefault'] })}><option value="">同 A</option>{['自动转付费', '到期停止', '无试用'].map((c) => <option key={c}>{c}</option>)}</select></Field>
                <Field label="价格说法" className="c12"><input type="text" value={cfg.variantB.priceFraming ?? ''} onChange={(e) => setB({ priceFraming: e.target.value })} placeholder={p.priceFraming || '例如：一次付清全年 168 元'} /></Field>
                <Field label="完整介绍" className="c12"><textarea rows={2} value={cfg.variantB.description ?? ''} onChange={(e) => setB({ description: e.target.value })} placeholder="留空则同 A" /></Field>
              </div>
            )}
          </Card>

          <Card>
            <div className="step-title"><span className="step-no">04</span><h2>人群</h2><span className="muted small">在本地按权重抽样；抽样参数是粗略设定，不是统计数据</span></div>
            <div className="row" style={{ marginBottom: 12 }}>
              {AUDIENCE_PRESETS.map((a) => (
                <button key={a.id} className="chip" onClick={() => setA({ countryWeights: Object.fromEntries(COUNTRIES.map((c) => [c.id, a.weights[c.id] ?? 0])) })}>{a.label}</button>
              ))}
              <span className="small muted">国内约 {(domesticShare * 100).toFixed(0)}%，海外约 {((1 - domesticShare) * 100).toFixed(0)}%</span>
            </div>
            <div className="grid g2" style={{ gap: '4px 28px' }}>
              {GROUPS.map((g) => (
                <div key={g} className="col" style={{ gap: 2 }}>
                  <div className="tiny muted" style={{ marginTop: 6, letterSpacing: '0.08em' }}>{g}</div>
                  {COUNTRIES.filter((c) => c.group === g).map((c) => (
                    <SliderRow key={c.id} label={c.name} value={cfg.audience.countryWeights[c.id] ?? 0} min={0} max={100}
                      fmt={(v) => `${((v / totalW) * 100).toFixed(0)}%`}
                      onChange={(v) => setA({ countryWeights: { ...cfg.audience.countryWeights, [c.id]: v } })} />
                  ))}
                </div>
              ))}
            </div>
            <div className="hr" />
            <div className="grid g2" style={{ gap: '8px 28px' }}>
              <div className="col">
                <SliderRow label="最小年龄" value={cfg.audience.ageMin} min={15} max={80} onChange={(v) => setA({ ageMin: Math.min(v, cfg.audience.ageMax) })} />
                <SliderRow label="最大年龄" value={cfg.audience.ageMax} min={15} max={80} onChange={(v) => setA({ ageMax: Math.max(v, cfg.audience.ageMin) })} />
                <div className="row"><span className="small" style={{ width: 120 }}>年龄分布</span><Seg value={cfg.audience.ageShape} options={[{ v: 'adult', l: '近似成年人口' }, { v: 'uniform', l: '均匀' }]} onChange={(v) => setA({ ageShape: v })} /></div>
                <SliderRow label="女性占比" value={Math.round(cfg.audience.femaleShare * 100)} min={0} max={100} fmt={(v) => `${v}%`} onChange={(v) => setA({ femaleShare: v / 100 })} />
              </div>
              <div className="col">
                <div className="small"><b>看到多少信息</b> <span className="muted">真实的人多半只扫一眼；全读完的人设可能「知道得太多」（第七章）</span></div>
                {(['glance', 'store', 'full'] as Exposure[]).map((k) => (
                  <SliderRow key={k} label={EXPOSURE_LABEL[k]} value={cfg.audience.exposureMix[k]} min={0} max={100}
                    fmt={(v) => `${((v / expTotal) * 100).toFixed(0)}%`}
                    onChange={(v) => setA({ exposureMix: { ...cfg.audience.exposureMix, [k]: v } })} />
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <div className="step-title"><span className="step-no">05</span><h2>评价维度与追加问题</h2></div>
            <div className="col">
              {cfg.aspects.map((a, i) => (
                <div key={i} className="row" style={{ flexWrap: 'nowrap' }}>
                  <input type="text" style={{ width: 160 }} value={a.name} onChange={(e) => setCfg((c) => ({ ...c, aspects: c.aspects.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) }))} />
                  <input type="text" value={a.hint} onChange={(e) => setCfg((c) => ({ ...c, aspects: c.aspects.map((x, j) => (j === i ? { ...x, hint: e.target.value } : x)) }))} />
                  <button className="btn ghost sm" onClick={() => setCfg((c) => ({ ...c, aspects: c.aspects.filter((_, j) => j !== i) }))}>✕</button>
                </div>
              ))}
              <div className="row">
                <button className="btn sm" onClick={() => setCfg((c) => ({ ...c, aspects: [...c.aspects, { name: '新维度', hint: '说明这个维度问的是什么' }] }))}>＋ 添加维度</button>
                <button className="btn ghost sm" onClick={() => setCfg((c) => ({ ...c, aspects: DEFAULT_ASPECTS.map((a) => ({ ...a })) }))}>恢复默认</button>
              </div>
              <div className="hr" />
              <div className="small"><b>追加开放问题</b> <span className="muted">每个人设都会用自己的口吻回答，最多 3 题，报告里会汇总</span></div>
              {cfg.question.extraQuestions.map((q, i) => (
                <div key={i} className="row" style={{ flexWrap: 'nowrap' }}>
                  <input type="text" value={q} placeholder="例如：你最希望它多一个什么功能？" onChange={(e) => setQ({ extraQuestions: cfg.question.extraQuestions.map((x, j) => (j === i ? e.target.value : x)) })} />
                  <button className="btn ghost sm" onClick={() => setQ({ extraQuestions: cfg.question.extraQuestions.filter((_, j) => j !== i) })}>✕</button>
                </div>
              ))}
              {cfg.question.extraQuestions.length < 3 && <button className="btn sm" style={{ alignSelf: 'flex-start' }} onClick={() => setQ({ extraQuestions: [...cfg.question.extraQuestions, ''] })}>＋ 添加问题</button>}
            </div>
          </Card>

          <Card>
            <div className="step-title"><span className="step-no">06</span><h2>成本与精度</h2></div>
            <div className="row" style={{ marginBottom: 14 }}>
              {COST_PRESETS.map((c) => (
                <button key={c.id} className="chip" onClick={() => setC({ ...c.cost, budgetCNY: Math.max(cfg.cost.budgetCNY, Math.ceil(estimate({ ...cfg.cost, ...c.cost }, cfg.variantB.enabled, cfg.aspects.length).high)) })}>
                  <b>{c.label}</b> <span className="muted">{c.desc}</span>
                </button>
              ))}
            </div>
            <div className="grid g2" style={{ gap: '10px 28px' }}>
              <div className="col">
                <SliderRow label="样本量（人）" value={cfg.cost.sampleSize} min={5} max={1000} step={5} onChange={(v) => setC({ sampleSize: v })} />
                <SliderRow label="反序重测比例" value={Math.round(cfg.cost.retestShare * 100)} min={0} max={100} step={5} fmt={(v) => `${v}%`} onChange={(v) => setC({ retestShare: v / 100 })} />
                <SliderRow label="并发数" value={cfg.cost.concurrency} min={1} max={60} onChange={(v) => setC({ concurrency: v })} />
                <SliderRow label="温度" value={cfg.cost.temperature} min={0.3} max={1.5} step={0.1} fmt={(v) => v.toFixed(1)} onChange={(v) => setC({ temperature: v })} />
                <SliderRow label="预算上限（元）" value={cfg.cost.budgetCNY} min={1} max={500} onChange={(v) => setC({ budgetCNY: v })} fmt={(v) => `¥${v}`} />
              </div>
              <div className="col">
                <div className="row"><span className="small" style={{ width: 90 }}>模型</span><Seg value={cfg.cost.model} options={Object.entries(PRICES).map(([v, x]) => ({ v: v as RunConfig['cost']['model'], l: x.label }))} onChange={(v) => setC({ model: v })} /></div>
                <div className="row"><span className="small" style={{ width: 90 }}>思考深度</span><Seg value={cfg.cost.thinking} options={[{ v: 'off', l: '关' }, { v: 'low', l: '低' }, { v: 'high', l: '高' }, { v: 'max', l: '最高' }]} onChange={(v) => setC({ thinking: v })} /></div>
                <div className="row"><span className="small" style={{ width: 90 }}>回答篇幅</span><Seg value={cfg.cost.detail} options={[{ v: 'brief', l: '简洁' }, { v: 'standard', l: '标准' }, { v: 'deep', l: '详尽' }]} onChange={(v) => setC({ detail: v })} /></div>
                <label className="check"><input type="checkbox" checked={cfg.cost.autoReport} onChange={(e) => setC({ autoReport: e.target.checked })} /> 跑完后自动生成 AI 解读报告</label>
                <div className="row"><span className="small" style={{ width: 90 }}>报告模型</span><Seg value={cfg.cost.reportModel} options={Object.entries(PRICES).map(([v, x]) => ({ v: v as RunConfig['cost']['model'], l: x.label }))} onChange={(v) => setC({ reportModel: v })} /></div>
              </div>
            </div>
            <p className="small muted mt8">
              反序重测：抽一部分人设，把比较题的选项倒过来、换一种问法再问一次。结果若随顺序变化，变化的那部分不是人设的意见（第七章）。温度高一些能让回答更分散，但多个人设仍来自同一个模型，并不独立（第六章）。
            </p>
          </Card>
        </div>

        <div className="col gap16 sticky-sum">
          <Card>
            <div className="small muted">预计花费</div>
            <div className="cost-big num">{yuan(est.total)}</div>
            <div className="small muted mt8">约 {yuan(est.low)} – {yuan(est.high)} · {est.calls} 次调用 · 每次约 {yuan(est.perCall)}</div>
            <div className="tiny muted">{est.peak ? '按高峰全价估算' : '按空闲半价估算'}{cfg.cost.autoReport ? `，含报告约 ${yuan(est.reportCost)}` : ''}</div>
            {est.high > cfg.cost.budgetCNY && <div className="note red mt8 small">预算上限 ¥{cfg.cost.budgetCNY} 可能不够，到达上限会自动停止。</div>}
            <div className="hr" />
            <div className="col">
              <button className="btn primary lg" onClick={start} disabled={starting}>{starting ? <span className="spin" /> : '▶'} 开始预测</button>
              <button className="btn" onClick={doPreview}>先看看会抽到哪些人</button>
            </div>
          </Card>
          <Card title="题目问清楚了吗" sub="第四至第六章的核对">
            <CheckList items={checks.f} />
          </Card>
          <Card title="意向能不能预测购买" sub="Morwitz 等（2007）的六个条件">
            <CheckList items={checks.m} />
            <div className="tiny muted mt8">满足 {checks.m.filter((c) => c.ok).length}/6 条。越少，「说会」越难对应到「真买」，结果的不确定性越大。</div>
          </Card>
        </div>
      </div>

      {preview && (
        <div className="modal-bg" onClick={() => { setPreview(null); setShowPrompt(false); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="row between">
              <h2>抽样预览（前 {preview.length} 人）</h2>
              <div className="row">
                <button className="btn sm" onClick={() => setShowPrompt((s) => !s)}>{showPrompt ? '收起提示词' : '查看第 1 人的完整提示词'}</button>
                <button className="btn sm" onClick={() => { setCfg((c) => ({ ...c, seed: Math.floor(Math.random() * 1e9) })); setTimeout(doPreview, 0); }}>换一批</button>
                <button className="btn ghost sm" onClick={() => setPreview(null)}>关闭</button>
              </div>
            </div>
            {promptSample && (
              <div className="col mt16">
                <div className="small muted">系统提示（同一次预测里所有人共享，命中缓存）</div>
                <pre className="card small" style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--mono)', fontSize: 11 }}>{promptSample.sys}</pre>
                <div className="small muted">用户消息（每个人不同）</div>
                <pre className="card small" style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--mono)', fontSize: 11 }}>{promptSample.user}</pre>
              </div>
            )}
            <div className="col mt16">
              {preview.map((x) => (
                <Card key={x.id} title={`${x.name} · ${x.age} 岁 ${x.gender}`} sub={`${x.country} · ${x.cityTier} · ${x.occupation} · 收入${x.incomeLabel} · ${EXPOSURE_LABEL[x.exposure]}`}>
                  <div className="kv">
                    <span>若—则</span><span>{x.signatures.join('；')}</span>
                    <span>经历</span><span>{x.history.join('；')}；{x.currentTool}</span>
                    <span>在意</span><span>{x.goals.join('；')}；{x.narrative}</span>
                    <span>此刻</span><span>{x.moment}，心情{x.mood}，{x.recentEvent}；经由{x.channel}看到</span>
                    <span>身边人</span><span>{x.peerNorm}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

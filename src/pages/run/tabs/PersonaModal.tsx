import { Fragment, useState } from 'react';
import { Chart, PALETTE } from '@/components/Chart';
import { Card, MiniBar } from '@/components/ui';
import { buildSystem, buildUser } from '@/domain/prompts';
import { makeRng } from '@/domain/rng';
import type { Answer, Run, VariantId } from '@/domain/types';
import { CHOICE_LABEL, EXPOSURE_LABEL, TRAIT_LABEL } from '@/domain/vocab';
import { askPersona } from '@/services/interview';
import { notify, persistRun } from '@/state/runs';

function AnswerBlock({ a, run, title }: { a: Answer; run: Run; title: string }) {
  return (
    <Card title={title}>
      <div className="quote serif" style={{ fontSize: 17, lineHeight: 1.6, marginBottom: 10 }}>「{a.first_reaction}」</div>
      <h4 style={{ margin: '10px 0 8px' }}>思考过程 <span className="tiny muted">这是人设自己以为的理由，不等于真正推动选择的机制（第三章）</span></h4>
      <ol className="steps">{a.thinking_steps.map((s, i) => <li key={i}><span>{s}</span></li>)}</ol>
      <div className="grid g2 mt16">
        <div className="col">
          <MiniBar label="注意力" value={a.attention} max={10} />
          <MiniBar label="看懂程度" value={a.clarity} max={10} />
          <MiniBar label="想要" value={a.wanting} max={10} />
          <MiniBar label="预计喜欢" value={a.expected_liking} max={10} />
          <MiniBar label="推荐意愿" value={a.recommend} max={10} />
          <MiniBar label="自评确定度" value={a.self_confidence} />
        </div>
        <div className="col">
          <MiniBar label="试用" value={a.prob.try} tone="teal" />
          <MiniBar label="试用后 30 天仍在用" value={a.prob.active_30d} tone="teal" />
          <MiniBar label="首笔付费" value={a.prob.pay} tone="red" />
          <MiniBar label="付费后续费" value={a.prob.renew} tone="red" />
          <MiniBar label="一年后仍在用" value={a.prob.still_1y} tone="red" />
        </div>
      </div>
      <div className="kv mt16">
        <span>情绪</span><span>{a.emotion.primary}（强度 {a.emotion.intensity}）</span>
        <span>比较题</span><span><b>{CHOICE_LABEL[a.choice]}</b>　{a.choiceReason}</span>
        <span>采用时机</span><span>{a.timing}</span>
        <span>心理价位</span><span>{a.wtp.amount ? `${a.wtp.amount} ${a.wtp.currency}/${a.wtp.period}` : '没有'}　对标价：{a.wtp.price_feel || '—'}<span className="tiny muted">（陈述偏好，通常高于真付）</span></span>
        <span>身份契合</span><span>{a.identity_fit > 0 ? '+' : ''}{a.identity_fit}　{a.identity_note}</span>
        <span>默认效应</span><span>{a.default_effect}</span>
        <span>放弃点</span><span>{a.deal_breaker || '—'}</span>
        <span>改主意条件</span><span>{a.would_change_mind}</span>
        <span>吸引点</span><span>{a.attractions.map((t) => <span key={t} className="tag teal">{t}</span>)}</span>
        <span>顾虑</span><span>{a.concerns.map((t) => <span key={t} className="tag red">{t}</span>)}</span>
        <span>原话</span><span className="serif">{a.quote}{a.quote_zh && a.quote_zh !== a.quote ? <div className="muted">{a.quote_zh}</div> : null}</span>
        {run.config.question.extraQuestions.filter((q) => q.trim()).map((q, i) => (
          <Fragment key={i}><span>追加 {i + 1}</span><span><span className="muted small">{q}</span><br />{a.extra_answers[i] ?? '—'}</span></Fragment>
        ))}
      </div>
      <h4 style={{ margin: '16px 0 6px' }}>各方面</h4>
      <table className="t">
        <tbody>
          {run.config.aspects.map((asp) => {
            const x = a.aspects[asp.name];
            return (
              <tr key={asp.name}>
                <td style={{ width: 120 }}>{asp.name}</td>
                <td className="n" style={{ width: 40 }}><b>{x?.s ?? '—'}</b></td>
                <td style={{ width: 120 }}><div className="minibar"><div className="track"><div style={{ width: `${(x?.s ?? 0) * 10}%`, background: (x?.s ?? 0) >= 7 ? PALETTE[0] : (x?.s ?? 0) <= 4 ? PALETTE[1] : PALETTE[2] }} /></div></div></td>
                <td className="small">{x?.n}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

export function PersonaModal({ run, personaId, onClose }: { run: Run; personaId: string; onClose: () => void }) {
  const p = run.personas.find((x) => x.id === personaId)!;
  const recA = run.calls[`${p.id}|A|main`];
  const recB = run.calls[`${p.id}|B|main`];
  const recR = run.calls[`${p.id}|A|retest`];
  const [variant, setVariant] = useState<VariantId>('A');
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const chatKey = `${p.id}|${variant}`;
  const turns = run.chats[chatKey] ?? [];
  const rec = variant === 'B' ? recB : recA;

  async function ask() {
    if (!q.trim() || !rec?.answer) return;
    const question = q.trim();
    setQ('');
    setBusy(true);
    const history = [...turns, { role: 'user' as const, content: question }];
    run.chats[chatKey] = history;
    notify();
    try {
      const res = await askPersona(run, p, variant, rec, history);
      run.chats[chatKey] = [...history, { role: 'assistant', content: res.content }];
      run.spent += res.cost;
    } catch (e) {
      run.chats[chatKey] = [...history, { role: 'assistant', content: `（追问失败：${(e as Error).message}）` }];
    } finally {
      setBusy(false);
      void persistRun(run);
    }
  }

  const traitKeys = Object.keys(TRAIT_LABEL) as (keyof typeof TRAIT_LABEL)[];

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="row between">
          <div>
            <div className="eyebrow">{p.id.toUpperCase()} · {EXPOSURE_LABEL[p.exposure]}</div>
            <h2 style={{ fontSize: 26 }}>{p.name}</h2>
            <div className="muted">{p.country} · {p.cityTier}{p.diaspora ? ' · 华人' : ''} · {p.age} 岁 {p.gender} · {p.occupation}</div>
          </div>
          <button className="btn ghost" onClick={onClose}>关闭 ✕</button>
        </div>

        <div className="grid g2 mt16">
          <Card title="这个人">
            <div className="kv">
              <span>母语</span><span>{p.lang}</span>
              <span>学历 / 家庭</span><span>{p.education} · {p.family}</span>
              <span>收入</span><span>{p.occupation === '学生' ? '生活费' : '月收入'}约 {p.monthlyIncomeLocal.toLocaleString()} {p.currency}（≈¥{p.monthlyIncomeCNY.toLocaleString()}，当地{p.incomeLabel}）</span>
              <span>支付</span><span>{p.payMethods}</span>
              <span>数字习惯</span><span>{p.digitalHabit}</span>
              <span>目标</span><span>{p.goals.join('；')}</span>
              <span>自我看法</span><span>{p.narrative}</span>
              <span>身边人</span><span>{p.peerNorm}</span>
            </div>
          </Card>
          <Card title="相对同龄人的位置" sub="百分位；只说明趋势，不决定这一次（第二章）">
            <Chart height={200} option={{
              grid: { left: 8, right: 30, top: 4, bottom: 4, containLabel: true },
              xAxis: { type: 'value', min: 0, max: 100, show: false },
              yAxis: { type: 'category', inverse: true, data: traitKeys.map((k) => TRAIT_LABEL[k]) },
              series: [{ type: 'bar', barWidth: 10, data: traitKeys.map((k) => ({ value: p.traits[k], itemStyle: { color: p.traits[k] >= 67 ? PALETTE[0] : p.traits[k] <= 33 ? PALETTE[1] : '#b8ad98' } })), label: { show: true, position: 'right', fontSize: 10 }, markLine: { symbol: 'none', silent: true, lineStyle: { color: '#8a8376', type: 'dashed' }, data: [{ xAxis: 50 }], label: { show: false } } }],
            }} />
          </Card>
        </div>
        <div className="grid g2 mt16">
          <Card title="经历与若—则签名">
            <ul style={{ margin: 0, paddingLeft: 18 }} className="small">
              {p.history.map((h) => <li key={h}>{h}</li>)}
              <li>{p.currentTool}</li>
              {p.signatures.map((s) => <li key={s}><b>{s}</b></li>)}
            </ul>
          </Card>
          <Card title="此刻">
            <p className="small">{p.moment}，心情<b>{p.mood}</b>；{p.recentEvent}。通过「{p.channel}」看到它，{EXPOSURE_LABEL[p.exposure]}。</p>
            <p className="tiny muted">情境条件是按设定的比例分配给人设的，不是测到的人群流行率（附录 C 第 7 问）。</p>
          </Card>
        </div>

        {run.config.variantB.enabled && (
          <div className="row mt16">
            <button className={`chip ${variant === 'A' ? 'on' : ''}`} onClick={() => setVariant('A')}>看版本 A 的回答</button>
            <button className={`chip ${variant === 'B' ? 'on' : ''}`} onClick={() => setVariant('B')}>看{run.config.variantB.label || '版本 B'}的回答</button>
            {recA?.answer && recB?.answer && (
              <span className="small muted">付费概率 A {recA.answer.prob.pay}% → B {recB.answer.prob.pay}%（{recB.answer.prob.pay - recA.answer.prob.pay >= 0 ? '+' : ''}{recB.answer.prob.pay - recA.answer.prob.pay}）</span>
            )}
          </div>
        )}

        <div className="mt16">
          {rec?.answer ? <AnswerBlock a={rec.answer} run={run} title={variant === 'B' ? `${run.config.variantB.label || '版本 B'} 的回答` : '回答'} /> : (
            <Card><div className="muted">{rec?.status === 'error' ? `这次调用失败：${rec.error}` : '还没有回答'}</div></Card>
          )}
        </div>

        {variant === 'A' && recR?.answer && recA?.answer && (
          <Card title="反序重测" sub="同一个人，比较题选项倒序、换一种问法再问一次" className="mt16">
            <table className="t">
              <thead><tr><th>指标</th><th className="n">第一次</th><th className="n">重测</th><th className="n">变化</th></tr></thead>
              <tbody>
                {[['试用', recA.answer.prob.try, recR.answer.prob.try], ['首笔付费', recA.answer.prob.pay, recR.answer.prob.pay], ['想要', recA.answer.wanting, recR.answer.wanting], ['一年后', recA.answer.prob.still_1y, recR.answer.prob.still_1y]].map(([k, x, y]) => (
                  <tr key={k as string}><td>{k}</td><td className="n">{x}</td><td className="n">{y}</td><td className="n">{(y as number) - (x as number) >= 0 ? '+' : ''}{(y as number) - (x as number)}</td></tr>
                ))}
                <tr><td>比较题</td><td className="n">{CHOICE_LABEL[recA.answer.choice]}</td><td className="n">{CHOICE_LABEL[recR.answer.choice]}</td><td className="n">{recA.answer.choice === recR.answer.choice ? '一致' : '改变'}</td></tr>
              </tbody>
            </table>
          </Card>
        )}

        <Card title={`追问 ${p.name}`} sub="以这个人的身份继续回答；每次约几分钱" className="mt16">
          <div className="chatbox">
            {turns.length === 0 && <div className="small muted">可以问：为什么不想付钱？如果价格减半呢？你会怎么跟朋友介绍它？</div>}
            {turns.map((t, i) => <div key={i} className={`bubble ${t.role === 'user' ? 'u' : 'a'}`}>{t.content}</div>)}
            {busy && <div className="bubble a"><span className="spin" /></div>}
          </div>
          <div className="row mt16" style={{ flexWrap: 'nowrap' }}>
            <input type="text" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) void ask(); }} placeholder="输入追问，回车发送" disabled={!rec?.answer} />
            <button className="btn primary" onClick={ask} disabled={busy || !rec?.answer}>发送</button>
          </div>
        </Card>

        <div className="row mt16">
          {rec?.reasoning && <button className="btn sm" onClick={() => setShowReasoning((s) => !s)}>{showReasoning ? '收起' : '查看'}模型原始推理</button>}
          <button className="btn sm" onClick={() => setShowPrompt((s) => !s)}>{showPrompt ? '收起' : '查看'}给这个人的提示词</button>
          {rec && <span className="tiny muted">耗时 {(rec.ms / 1000).toFixed(1)} 秒 · 输入 {rec.usage.hit + rec.usage.miss}（命中缓存 {rec.usage.hit}）· 输出 {rec.usage.out} tokens · ¥{rec.cost.toFixed(4)}</span>}
        </div>
        {showReasoning && rec?.reasoning && <pre className="card small mt8" style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{rec.reasoning}</pre>}
        {showPrompt && (
          <pre className="card small mt8" style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--mono)', fontSize: 11 }}>
            {buildSystem(run.config, variant, p.exposure)}
            {'\n\n──────── 用户消息 ────────\n\n'}
            {buildUser(run.config, variant, p, makeRng(1), undefined, rec?.optionOrder).text}
          </pre>
        )}
      </div>
    </div>
  );
}

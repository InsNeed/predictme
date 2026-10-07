import { Chart, PALETTE } from '@/components/Chart';
import { Card, Stat } from '@/components/ui';
import { fmt, groupStats, DIM_BY_ID, metricsFor, retest, stats, type Row } from '@/domain/aggregate';
import { yuan } from '@/domain/pricing';
import type { Run } from '@/domain/types';

export function Robustness({ run, rows }: { run: Run; rows: Row[] }) {
  const rt = retest(rows);
  const ids = new Set(rows.map((r) => r.p.id));
  const recs = Object.values(run.calls).filter((c) => ids.has(c.personaId));
  const ok = recs.filter((c) => c.status === 'ok');
  const errs = recs.filter((c) => c.status === 'error');
  const hit = ok.reduce((s, c) => s + c.usage.hit, 0);
  const miss = ok.reduce((s, c) => s + c.usage.miss, 0);
  const out = ok.reduce((s, c) => s + c.usage.out, 0);
  const avgMs = ok.length ? ok.reduce((s, c) => s + c.ms, 0) / ok.length : 0;

  const pos = [0, 1, 2].map((i) => {
    const xs = ok.filter((c) => c.kind === 'main' && c.variant === 'A' && c.answer);
    const at = xs.filter((c) => c.optionOrder.indexOf('this') === i);
    const chose = at.filter((c) => c.answer!.choice === 'this').length;
    return { pos: ['A', 'B', 'C'][i], n: at.length, share: at.length ? (chose / at.length) * 100 : NaN };
  });
  const letter = [0, 1, 2].map((i) => {
    const xs = ok.filter((c) => c.kind === 'main' && c.answer);
    return xs.filter((c) => c.optionOrder.indexOf(c.answer!.choice) === i).length;
  });
  const letterTotal = letter.reduce((s, x) => s + x, 0) || 1;

  const pays = rows.filter((r) => r.a).map((r) => r.a!.prob.pay);
  const sPay = stats(pays);
  const mid = pays.filter((x) => x >= 40 && x <= 60).length;
  const fifty = pays.filter((x) => x === 50).length;
  const ms = metricsFor([]);
  const expo = groupStats(rows, DIM_BY_ID.exposure, 'A', ms.find((m) => m.id === 'pay')!);
  const expoTry = groupStats(rows, DIM_BY_ID.exposure, 'A', ms.find((m) => m.id === 'try')!);

  return (
    <div className="col gap16">
      <div className="note red">
        这一页回答：结果里有多少是人设的「意见」，有多少是问法、顺序和模型本身的倾向。一个由模型扮演的人说「会付钱」，和一个真实的人真的付钱之间，至少隔着三层距离：模型和这类真人、这类真人和具体某个人、嘴上说的和真的做的（第七章）。下面的检查只能看见第一层的一部分。
      </div>

      <div className="grid g4">
        <Card><Stat label="反序重测人数" value={rt.n} foot={`占当前 ${rows.length} 人的 ${rows.length ? ((rt.n / rows.length) * 100).toFixed(0) : 0}%`} /></Card>
        <Card><Stat label="付费概率平均变化" value={fmt(rt.dPay, '')} unit="个百分点" foot="同一人、选项倒序、换问法" accent /></Card>
        <Card><Stat label="比较题前后一致" value={fmt(rt.choiceAgree, '')} unit="%" foot="不一致的部分不是人设的意见" /></Card>
        <Card><Stat label="两次付费概率相关" value={Number.isFinite(rt.corrPay) ? rt.corrPay.toFixed(2) : '—'} foot="越接近 1 越稳定" /></Card>
      </div>

      <div className="grid g2">
        <Card title="重测散点" sub="横轴第一次、纵轴重测的首笔付费概率；越贴近对角线越稳">
          {rt.n ? (
            <Chart height={300} option={{
              xAxis: { type: 'value', min: 0, max: 100, name: '第一次', nameLocation: 'middle', nameGap: 24 },
              yAxis: { type: 'value', min: 0, max: 100, name: '重测' },
              tooltip: { formatter: (p: any) => `${p.data[2]}<br/>${p.data[0]}% → ${p.data[1]}%` },
              series: [
                { type: 'scatter', data: rt.pairs.map((x) => [x.a, x.b, x.name]), symbolSize: 10, itemStyle: { color: PALETTE[0], opacity: 0.7 } },
                { type: 'line', data: [[0, 0], [100, 100]], symbol: 'none', lineStyle: { type: 'dashed', color: '#8a8376' }, silent: true },
              ],
            }} />
          ) : <div className="muted small">这次没有设置重测比例。新建预测时把「反序重测比例」调到 10% 以上即可。</div>}
        </Card>
        <Card title="选项位置效应" sub="不额外花钱：每个人的比较题选项本来就是随机排序的">
          <Chart height={200} option={{
            tooltip: { trigger: 'axis', formatter: (p: any) => `本产品放在 ${pos[p[0].dataIndex].pos} 位<br/>选它的比例 ${p[0].value?.toFixed?.(1) ?? '—'}%（n=${pos[p[0].dataIndex].n}）` },
            xAxis: { type: 'category', data: pos.map((x) => `放在 ${x.pos} 位`) },
            yAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
            series: [{ type: 'bar', barWidth: 40, data: pos.map((x) => (Number.isFinite(x.share) ? +x.share.toFixed(1) : null)), itemStyle: { color: PALETTE[2] }, label: { show: true, position: 'top', formatter: '{c}%' } }],
          }} />
          <p className="small">
            被选中的字母分布：A {((letter[0] / letterTotal) * 100).toFixed(0)}% · B {((letter[1] / letterTotal) * 100).toFixed(0)}% · C {((letter[2] / letterTotal) * 100).toFixed(0)}%。
            <span className="muted"> 如果「本产品」放在 A 位时被选得明显更多，或者 A 被选得远多于三分之一，说明有一部分回答反映的是位置而不是人设（Dominguez-Olmedo 等，2024）。</span>
          </p>
        </Card>
      </div>

      <div className="grid g2">
        <Card title="回答是否挤在中间" sub="模型扮演的回答常比真人更集中（Bisbee 等，2024）">
          <div className="grid g3">
            <Stat label="首付概率标准差" value={fmt(sPay.sd, '')} />
            <Stat label="落在 40–60 之间" value={pays.length ? ((mid / pays.length) * 100).toFixed(0) : '—'} unit="%" />
            <Stat label="恰好写 50" value={pays.length ? ((fifty / pays.length) * 100).toFixed(0) : '—'} unit="%" />
          </div>
          <p className="small muted mt8">提示里要求「不要为了中立都写 50」。如果恰好写 50 的比例仍然很高，说明模型在回避判断，这部分不包含人设信息。</p>
        </Card>
        <Card title="知道得越多，越乐观吗" sub="按信息暴露分组（第七章「太正确也是失真」）">
          <table className="t">
            <thead><tr><th>看到多少</th><th className="n">n</th><th className="n">试用</th><th className="n">首付</th></tr></thead>
            <tbody>
              {expo.map((g, i) => (
                <tr key={g.key}><td>{g.key}</td><td className="n">{g.n}</td><td className="n">{fmt(expoTry[i]?.s.mean ?? NaN, '%')}</td><td className="n">{fmt(g.s.mean, '%')}</td></tr>
              ))}
            </tbody>
          </table>
          <p className="small muted mt8">真实的人多半只看了一眼。读完全部介绍的人设如果明显更乐观，汇总时要想清楚真实人群里有多少人会读完。</p>
        </Card>
      </div>

      <Card title="调用统计">
        <div className="grid g6">
          <Stat label="成功调用" value={ok.length} />
          <Stat label="失败" value={errs.length} />
          <Stat label="平均耗时" value={(avgMs / 1000).toFixed(1)} unit="秒" />
          <Stat label="缓存命中率" value={hit + miss ? ((hit / (hit + miss)) * 100).toFixed(0) : '—'} unit="%" />
          <Stat label="输出 tokens" value={(out / 1000).toFixed(1)} unit="千" />
          <Stat label="本次总花费" value={yuan(run.spent)} />
        </div>
        {errs.length > 0 && (
          <table className="t mt16">
            <thead><tr><th>人设</th><th>版本</th><th>错误</th></tr></thead>
            <tbody>{errs.slice(0, 20).map((e) => <tr key={e.key}><td>{e.personaId}</td><td>{e.variant} · {e.kind === 'retest' ? '重测' : '主问'}</td><td className="small">{e.error}</td></tr>)}</tbody>
          </table>
        )}
        <p className="small muted mt8">多个人设由同一个模型、同一套系统提示生成，回答并不独立。它们一致，不说明它们对（Lorenz 等，2011）。</p>
      </Card>
    </div>
  );
}

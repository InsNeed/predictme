import type { Row } from '@/domain/aggregate';
import type { Run } from '@/domain/types';
import { CHOICE_LABEL, TRAIT_LABEL } from '@/domain/vocab';

function download(name: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export function exportJson(run: Run) {
  download(`${run.title}.json`, JSON.stringify(run, null, 2), 'application/json');
}

const esc = (v: unknown) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function exportCsv(run: Run, rows: Row[]) {
  const aspects = run.config.aspects.map((a) => a.name);
  const head = [
    'id', '名字', '国家/地区', '国内', '城市层级', '年龄', '性别', '职业', '收入层', '月收入(元)', '家庭', '主要经历', '心情', '近期事件', '渠道', '信息暴露', '身边人',
    ...Object.values(TRAIT_LABEL),
    '版本', '第一反应', '注意力', '看懂', '想要', '预计喜欢', '情绪', '情绪强度', '比较题', '试用%', '首付%', '30天在用%', '续费%', '一年后%', '推荐', '采用时机',
    '心理价位', '货币', '周期', '价格感受', '吸引点', '顾虑', '身份契合', '放弃点', '改主意', '默认效应', '确定度', '原话', '原话中文',
    ...aspects.map((a) => `维度:${a}`), '思考过程', '追加回答',
  ];
  const lines = [head.join(',')];
  for (const r of rows) {
    for (const [v, a] of [['A', r.a], ['B', r.b]] as const) {
      if (!a) continue;
      const p = r.p;
      lines.push([
        p.id, p.name, p.country, p.domestic ? '是' : '否', p.cityTier, p.age, p.gender, p.occupation, p.incomeLabel, p.monthlyIncomeCNY, p.family, p.historyKey, p.mood, p.recentEvent, p.channel, p.exposure, p.peerNorm,
        p.traits.O, p.traits.C, p.traits.E, p.traits.A, p.traits.ES, p.traits.H,
        v, a.first_reaction, a.attention, a.clarity, a.wanting, a.expected_liking, a.emotion.primary, a.emotion.intensity, CHOICE_LABEL[a.choice],
        a.prob.try, a.prob.pay, a.prob.active_30d, a.prob.renew, a.prob.still_1y, a.recommend, a.timing,
        a.wtp.amount, a.wtp.currency, a.wtp.period, a.wtp.price_feel, a.attractions.join('|'), a.concerns.join('|'), a.identity_fit, a.deal_breaker, a.would_change_mind, a.default_effect, a.self_confidence, a.quote, a.quote_zh,
        ...aspects.map((n) => a.aspects[n]?.s ?? ''), a.thinking_steps.join(' / '), a.extra_answers.join(' / '),
      ].map(esc).join(','));
    }
  }
  download(`${run.title}.csv`, '\ufeff' + lines.join('\n'), 'text/csv;charset=utf-8');
}

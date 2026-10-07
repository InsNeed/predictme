import { useMemo, useState } from 'react';
import { MiniBar, Seg } from '@/components/ui';
import { answerFor, type Row, type View } from '@/domain/aggregate';
import type { Run } from '@/domain/types';
import { CHOICE_LABEL, EMOTION_COLOR, EXPOSURE_LABEL } from '@/domain/vocab';
import { PersonaModal } from './PersonaModal';

type Sort = 'payDesc' | 'payAsc' | 'want' | 'idx';

export function Voices({ run, rows, view }: { run: Run; rows: Row[]; view: View }) {
  const [sort, setSort] = useState<Sort>('payDesc');
  const [limit, setLimit] = useState(60);
  const [open, setOpen] = useState<string | null>(null);
  const v = view === 'diff' ? 'A' : view;
  const list = useMemo(() => {
    const xs = rows.filter((r) => answerFor(r, v));
    const g = (r: Row) => answerFor(r, v)!;
    if (sort === 'payDesc') xs.sort((a, b) => g(b).prob.pay - g(a).prob.pay || g(b).prob.try - g(a).prob.try);
    if (sort === 'payAsc') xs.sort((a, b) => g(a).prob.pay - g(b).prob.pay || g(a).prob.try - g(b).prob.try);
    if (sort === 'want') xs.sort((a, b) => g(b).wanting - g(a).wanting);
    if (sort === 'idx') xs.sort((a, b) => a.p.idx - b.p.idx);
    return xs;
  }, [rows, sort, v]);
  const pending = rows.filter((r) => !answerFor(r, v)).length;

  return (
    <div>
      <div className="row between" style={{ marginBottom: 14 }}>
        <Seg value={sort} onChange={setSort} options={[{ v: 'payDesc', l: '最可能付费' }, { v: 'payAsc', l: '最不可能付费' }, { v: 'want', l: '最想要' }, { v: 'idx', l: '抽样顺序' }]} />
        <span className="small muted">{list.length} 人有回答{pending ? `，${pending} 人还没回答或失败` : ''}。点开任何一位可以看完整思考过程，并继续追问。</span>
      </div>
      <div className="voices">
        {list.slice(0, limit).map((r) => {
          const a = answerFor(r, v)!;
          return (
            <div key={r.p.id} className="voice" onClick={() => setOpen(r.p.id)}>
              <div className="who">
                <div>
                  <div className="name">{r.p.name}</div>
                  <div className="meta">{r.p.country} · {r.p.cityTier} · {r.p.age}岁{r.p.gender} · {r.p.occupation}</div>
                </div>
                <span className="tag" style={{ background: EMOTION_COLOR[a.emotion.primary] ?? '#8a8376', color: '#fbf8f1', height: 'fit-content' }}>{a.emotion.primary}</span>
              </div>
              <div className="quote">{a.quote_zh || a.first_reaction}</div>
              {a.quote && a.quote !== a.quote_zh && <div className="tiny muted" style={{ fontStyle: 'italic' }}>{a.quote}</div>}
              <div className="bars">
                <MiniBar label="想要" value={a.wanting} max={10} />
                <MiniBar label="试用" value={a.prob.try} tone="teal" />
                <MiniBar label="付费" value={a.prob.pay} tone="red" />
              </div>
              <div className="row" style={{ gap: 4 }}>
                <span className="tag dark">{CHOICE_LABEL[a.choice]}</span>
                <span className="tag">{EXPOSURE_LABEL[r.p.exposure]}</span>
                {a.concerns.slice(0, 2).map((c) => <span key={c} className="tag red">{c}</span>)}
                {a.attractions.slice(0, 1).map((c) => <span key={c} className="tag teal">{c}</span>)}
              </div>
            </div>
          );
        })}
      </div>
      {list.length > limit && (
        <div className="row mt16" style={{ justifyContent: 'center' }}>
          <button className="btn" onClick={() => setLimit((l) => l + 60)}>再显示 60 人（还有 {list.length - limit}）</button>
        </div>
      )}
      {open && <PersonaModal run={run} personaId={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

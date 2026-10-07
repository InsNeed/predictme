import { useMemo, useState } from 'react';
import { DIMS, dimValues, filterCount, type Filters, type Row, type View } from '@/domain/aggregate';

const QUICK = ['domestic', 'ageBand', 'gender'];

export function FilterBar({ rows, filters, setFilters, view, shown }: { rows: Row[]; filters: Filters; setFilters: (f: Filters) => void; view: View; shown: number }) {
  const [open, setOpen] = useState(false);
  const values = useMemo(() => Object.fromEntries(DIMS.map((d) => [d.id, dimValues(rows, d, view)])), [rows, view]);
  const toggle = (id: string, v: string) => {
    const cur = filters.dims[id] ?? [];
    const next = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v];
    setFilters({ ...filters, dims: { ...filters.dims, [id]: next } });
  };
  const active = filterCount(filters);
  return (
    <div className="filterbar">
      <div className="row">
        <b className="small">筛选</b>
        {QUICK.map((id) => {
          const d = DIMS.find((x) => x.id === id)!;
          return (
            <div key={id} className="row" style={{ gap: 4 }}>
              {values[id].map(([v, n]) => (
                <button key={v} className={`chip ${(filters.dims[id] ?? []).includes(v) ? 'on' : ''}`} onClick={() => toggle(id, v)} title={d.label}>
                  {v} <span className="c">{n}</span>
                </button>
              ))}
              <span style={{ width: 6 }} />
            </div>
          );
        })}
        <input type="text" placeholder="搜索名字、原话、顾虑…" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} style={{ width: 200, padding: '4px 10px', fontSize: 12 }} />
        <button className="btn sm" onClick={() => setOpen((o) => !o)}>{open ? '收起' : '更多筛选'}{active ? `（${active}）` : ''}</button>
        {active > 0 && <button className="btn ghost sm" onClick={() => setFilters({ dims: {}, ageMin: 15, ageMax: 80, search: '' })}>清除</button>}
        <span className="small muted" style={{ marginLeft: 'auto' }}>显示 <b className="num">{shown}</b> / {rows.length} 人</span>
      </div>
      {open && (
        <div className="filter-panel">
          <div className="filter-group">
            <h4>年龄范围</h4>
            <div className="row" style={{ flexWrap: 'nowrap' }}>
              <input type="number" value={filters.ageMin} min={15} max={80} onChange={(e) => setFilters({ ...filters, ageMin: parseInt(e.target.value) || 15 })} style={{ width: 70 }} />
              <span>—</span>
              <input type="number" value={filters.ageMax} min={15} max={80} onChange={(e) => setFilters({ ...filters, ageMax: parseInt(e.target.value) || 80 })} style={{ width: 70 }} />
              <span className="small muted">岁</span>
            </div>
          </div>
          {DIMS.filter((d) => !QUICK.includes(d.id)).map((d) => (
            <div key={d.id} className="filter-group">
              <h4>{d.label}{d.answerBased ? ' · 按回答' : ''}</h4>
              <div className="chips">
                {values[d.id].map(([v, n]) => (
                  <button key={v} className={`chip ${(filters.dims[d.id] ?? []).includes(v) ? 'on' : ''}`} onClick={() => toggle(d.id, v)}>
                    {v} <span className="c">{n}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

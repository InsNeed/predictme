import type { ReactNode } from 'react';

export function Card({ title, sub, children, className = '', right }: { title?: ReactNode; sub?: ReactNode; children: ReactNode; className?: string; right?: ReactNode }) {
  return (
    <section className={`card ${className}`}>
      {(title || right) && (
        <div className="card-head">
          <div>
            {title && <h3>{title}</h3>}
            {sub && <div className="sub">{sub}</div>}
          </div>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, unit, foot, accent }: { label: string; value: ReactNode; unit?: string; foot?: ReactNode; accent?: boolean }) {
  return (
    <div className={`stat ${accent ? 'accent' : ''}`}>
      <span className="label">{label}</span>
      <span className="value">
        {value}
        {unit && <small>{unit}</small>}
      </span>
      {foot && <span className="foot">{foot}</span>}
    </div>
  );
}

export function Seg<T extends string>({ value, options, onChange }: { value: T; options: { v: T; l: ReactNode; disabled?: boolean; title?: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button key={o.v} className={o.v === value ? 'on' : ''} onClick={() => onChange(o.v)} type="button" disabled={o.disabled} title={o.title}>
          {o.l}
        </button>
      ))}
    </div>
  );
}

export function SliderRow({ label, value, min, max, step = 1, onChange, fmt }: { label: ReactNode; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; fmt?: (v: number) => string }) {
  return (
    <div className="slider-row">
      <span>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} />
      <span className="v">{fmt ? fmt(value) : value}</span>
    </div>
  );
}

export function MiniBar({ label, value, max = 100, tone = '' }: { label: string; value: number; max?: number; tone?: '' | 'red' | 'teal' }) {
  return (
    <div className={`minibar ${tone}`}>
      <div className="lab">
        <span>{label}</span>
        <span className="num">{Math.round(value)}</span>
      </div>
      <div className="track">
        <div style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%` }} />
      </div>
    </div>
  );
}

export function Field({ label, hint, children, className = '' }: { label: ReactNode; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={`f ${className}`}>
      <span>
        {label} {hint && <span className="hint">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

export function heatColor(t: number): string {
  const x = Math.max(0, Math.min(1, t));
  if (x >= 0.5) {
    const k = (x - 0.5) * 2;
    return `rgba(200, 69, 44, ${0.08 + k * 0.55})`;
  }
  const k = (0.5 - x) * 2;
  return `rgba(47, 111, 115, ${0.08 + k * 0.45})`;
}

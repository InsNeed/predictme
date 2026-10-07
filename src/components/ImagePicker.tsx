import { useEffect, useRef, useState, type ClipboardEvent, type DragEvent } from 'react';
import { MAX_IMAGES } from '@/domain/pricing';
import { firstSeenBy } from '@/domain/prompts';
import type { Exposure } from '@/domain/types';
import { compressImage, imageFilesFrom } from '@/services/images';

const SEEN_LABEL: Record<Exposure, string> = { glance: '扫一眼就能看到', store: '看商店页可见', full: '读完才看到' };

export function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="lightbox" onClick={onClose}>
      <img src={src} alt="" />
    </div>
  );
}

export function Thumbs({ images, labels = false, small = false }: { images: string[]; labels?: boolean; small?: boolean }) {
  const [open, setOpen] = useState<string | null>(null);
  if (!images.length) return null;
  return (
    <div className={`thumbs ${small ? 'sm' : ''}`}>
      {images.map((src, i) => (
        <div key={i} className="thumb" onClick={() => setOpen(src)}>
          <img src={src} alt={`截图 ${i + 1}`} />
          {labels && <span className="thumb-seen">{i + 1} · {SEEN_LABEL[firstSeenBy(i)]}</span>}
        </div>
      ))}
      {open && <Lightbox src={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

export function ImagePicker({ value, onChange, globalPaste = false, emptyHint }: {
  value: string[];
  onChange: (images: string[]) => void;
  globalPaste?: boolean;
  emptyHint?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef(value);
  valueRef.current = value;
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  async function add(files: File[]) {
    if (!files.length) return;
    const room = MAX_IMAGES - valueRef.current.length;
    if (room <= 0) {
      setError(`最多 ${MAX_IMAGES} 张`);
      return;
    }
    setBusy(true);
    setError(files.length > room ? `最多 ${MAX_IMAGES} 张，多出的 ${files.length - room} 张没有加入` : '');
    try {
      const urls = await Promise.all(files.slice(0, room).map(compressImage));
      onChange([...valueRef.current, ...urls]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!globalPaste) return;
    const onPaste = (e: globalThis.ClipboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest('.img-picker, input, textarea, select, [contenteditable="true"]')) return;
      const files = imageFilesFrom(e.clipboardData?.items);
      if (files.length) {
        e.preventDefault();
        void add(files);
      }
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  });

  function onPaste(e: ClipboardEvent) {
    const files = imageFilesFrom(e.clipboardData.items);
    if (files.length) {
      e.preventDefault();
      void add(files);
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setOver(false);
    void add(imageFilesFrom(e.dataTransfer.files));
  }

  function move(i: number, d: -1 | 1) {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const next = value.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  return (
    <div
      className={`img-picker ${over ? 'over' : ''}`}
      tabIndex={0}
      onPaste={onPaste}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
    >
      <div className="thumbs">
        {value.map((src, i) => (
          <div key={i} className="thumb">
            <img src={src} alt={`截图 ${i + 1}`} onClick={() => setOpen(src)} />
            <span className="thumb-seen">{i + 1} · {SEEN_LABEL[firstSeenBy(i)]}</span>
            <div className="thumb-tools">
              <button type="button" disabled={i === 0} onClick={() => move(i, -1)} title="往前">←</button>
              <button type="button" disabled={i === value.length - 1} onClick={() => move(i, 1)} title="往后">→</button>
              <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} title="删除">✕</button>
            </div>
          </div>
        ))}
        {value.length < MAX_IMAGES && (
          <button type="button" className="thumb add" onClick={() => fileRef.current?.click()} disabled={busy}>
            {busy ? <span className="spin" /> : <span>＋</span>}
            <span className="tiny muted">点击、拖拽或粘贴</span>
          </button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { void add(imageFilesFrom(e.target.files)); e.target.value = ''; }} />
      <div className="tiny muted mt8">
        {value.length ? `${value.length}/${MAX_IMAGES} 张。顺序决定谁看得到：第 1 张人人都看到，前 3 张看商店页的人看到，全部只有读完介绍的人看到。` : emptyHint ?? '可选。上传首屏、商店截图或关键界面，模拟的人会真的「看到」它们。'}
      </div>
      {error && <div className="tiny" style={{ color: 'var(--bad)' }}>{error}</div>}
      {open && <Lightbox src={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

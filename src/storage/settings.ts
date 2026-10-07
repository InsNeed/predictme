import { get, set } from 'idb-keyval';
import { defaultConfig } from '@/domain/defaults';
import type { RunConfig } from '@/domain/types';

const KEY_STORAGE = 'crowdlab.apiKey';
const DRAFT_STORAGE = 'crowdlab.draft';
// 截图体积大，放进 localStorage 很快会超出配额，所以单独存 IndexedDB。
const DRAFT_IMAGES = 'crowdlab:draftImages';

export interface DraftImages {
  product: string[];
  variantB: string[];
}

export function getApiKey(): string {
  return localStorage.getItem(KEY_STORAGE) || __DEV_API_KEY__ || '';
}

export function setApiKey(k: string) {
  if (k.trim()) localStorage.setItem(KEY_STORAGE, k.trim());
  else localStorage.removeItem(KEY_STORAGE);
}

export function hasDevApiKey(): boolean {
  return Boolean(__DEV_API_KEY__);
}

export function loadDraft(): RunConfig {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE);
    if (raw) {
      const d = JSON.parse(raw) as RunConfig;
      const base = defaultConfig();
      return { ...base, ...d, product: { ...base.product, ...d.product }, cost: { ...base.cost, ...d.cost }, audience: { ...base.audience, ...d.audience }, question: { ...base.question, ...d.question }, variantB: { ...base.variantB, ...d.variantB } };
    }
  } catch { /* 草稿损坏时用默认值 */ }
  return defaultConfig();
}

export async function loadDraftImages(): Promise<DraftImages> {
  try {
    const d = (await get(DRAFT_IMAGES)) as Partial<DraftImages> | undefined;
    return { product: d?.product ?? [], variantB: d?.variantB ?? [] };
  } catch {
    return { product: [], variantB: [] };
  }
}

let lastImages: { product?: string[]; variantB?: string[] } | null = null;

export function saveDraft(cfg: RunConfig) {
  const { images, ...product } = cfg.product;
  const { images: bImages, ...variantB } = cfg.variantB;
  localStorage.setItem(DRAFT_STORAGE, JSON.stringify({ ...cfg, product, variantB }));
  if (lastImages && lastImages.product === images && lastImages.variantB === bImages) return;
  lastImages = { product: images, variantB: bImages };
  void set(DRAFT_IMAGES, { product: images ?? [], variantB: bImages ?? [] } satisfies DraftImages);
}

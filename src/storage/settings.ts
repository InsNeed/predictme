import { defaultConfig } from '@/domain/defaults';
import type { RunConfig } from '@/domain/types';

const KEY_STORAGE = 'crowdlab.apiKey';
const DRAFT_STORAGE = 'crowdlab.draft';

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

export function saveDraft(cfg: RunConfig) {
  localStorage.setItem(DRAFT_STORAGE, JSON.stringify(cfg));
}

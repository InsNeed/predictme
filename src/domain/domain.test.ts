import { describe, expect, it } from 'vitest';
import { defaultConfig } from './defaults';
import { generatePersonas } from './personaGen';
import { plannedTasks } from './plan';
import { avgImagesSeen, costOf, isPeakNow } from './pricing';
import { buildUser, imagesFor, productFor } from './prompts';
import { makeRng } from './rng';
import type { Run } from './types';

function makeRun(n: number, variantB: boolean, retestShare: number): Run {
  const config = defaultConfig();
  config.cost = { ...config.cost, sampleSize: n, retestShare };
  config.variantB = { ...config.variantB, enabled: variantB };
  const personas = generatePersonas(n, config.audience, config.product, config.seed);
  return { id: 't', title: 't', createdAt: 0, config, personas, calls: {}, chats: {}, status: 'draft', spent: 0 };
}

describe('rng', () => {
  it('同一个种子给出同一串数', () => {
    const a = makeRng(42);
    const b = makeRng(42);
    expect(Array.from({ length: 5 }, () => a.next())).toEqual(Array.from({ length: 5 }, () => b.next()));
  });
});

describe('generatePersonas', () => {
  it('同一个种子生成同一批人设', () => {
    const cfg = defaultConfig();
    const a = generatePersonas(20, cfg.audience, cfg.product, 7);
    const b = generatePersonas(20, cfg.audience, cfg.product, 7);
    expect(a).toHaveLength(20);
    expect(a).toEqual(b);
  });
});

describe('plannedTasks', () => {
  it('每人一条主调用，开启 B 版本时再加一条，外加按比例抽取的重测', () => {
    const run = makeRun(20, true, 0.25);
    const tasks = plannedTasks(run);
    expect(tasks.filter((t) => t.kind === 'main' && t.variant === 'A')).toHaveLength(20);
    expect(tasks.filter((t) => t.kind === 'main' && t.variant === 'B')).toHaveLength(20);
    expect(tasks.filter((t) => t.kind === 'retest')).toHaveLength(5);
    expect(new Set(tasks.map((t) => t.key)).size).toBe(tasks.length);
  });
});

describe('pricing', () => {
  it('北京时间周末不算高峰', () => {
    expect(isPeakNow(new Date('2026-10-10T02:00:00Z'))).toBe(false);
  });

  it('工作日上午十点（北京时间）是高峰', () => {
    expect(isPeakNow(new Date('2026-10-07T02:00:00Z'))).toBe(true);
  });

  it('空闲时段半价', () => {
    const u = { hit: 1e6, miss: 1e6, out: 1e6, reasoning: 0 };
    expect(costOf('deepseek-flash', u, false)).toBeCloseTo(costOf('deepseek-flash', u, true) / 2);
  });

  it('图片张数按信息量加权平均', () => {
    expect(avgImagesSeen(4, { glance: 1, store: 1, full: 0 })).toBeCloseTo(2);
    expect(avgImagesSeen(0, { glance: 1, store: 1, full: 1 })).toBe(0);
  });
});

describe('images', () => {
  const imgs = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  it('扫一眼看 1 张，商店页看 3 张，读完最多看 6 张', () => {
    const p = { ...defaultConfig().product, images: imgs };
    expect(imagesFor(p, 'glance')).toEqual(['a']);
    expect(imagesFor(p, 'store')).toEqual(['a', 'b', 'c']);
    expect(imagesFor(p, 'full')).toHaveLength(6);
  });

  it('B 版本没传图时沿用 A 的图，传了就用自己的', () => {
    const cfg = defaultConfig();
    cfg.product.images = ['a1'];
    cfg.variantB = { ...cfg.variantB, enabled: true };
    expect(productFor(cfg, 'B').images).toEqual(['a1']);
    cfg.variantB.images = ['b1', 'b2'];
    expect(productFor(cfg, 'B').images).toEqual(['b1', 'b2']);
    expect(productFor(cfg, 'A').images).toEqual(['a1']);
  });

  it('用户消息带上该人设看得到的图', () => {
    const cfg = defaultConfig();
    cfg.product.images = imgs;
    const [persona] = generatePersonas(1, cfg.audience, cfg.product, 3);
    const u = buildUser(cfg, 'A', persona, makeRng(1));
    expect(u.images).toEqual(imagesFor(cfg.product, persona.exposure));
  });
});

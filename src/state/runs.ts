import { useEffect, useState, useSyncExternalStore } from 'react';
import { Runner } from '@/services/runner';
import { loadRun, saveRun } from '@/storage/runs';
import type { Run } from '@/domain/types';

const runs = new Map<string, Run>();
const runners = new Map<string, Runner>();
const listeners = new Set<() => void>();
let version = 0;
let lastFire = 0;
let pending: number | null = null;

export function notify() {
  const now = performance.now();
  if (now - lastFire > 250) {
    lastFire = now;
    version++;
    listeners.forEach((l) => l());
    return;
  }
  if (pending) return;
  pending = window.setTimeout(() => {
    pending = null;
    lastFire = performance.now();
    version++;
    listeners.forEach((l) => l());
  }, 250);
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useVersion(): number {
  return useSyncExternalStore(subscribe, () => version);
}

export function getRunner(run: Run): Runner {
  let r = runners.get(run.id);
  if (!r) {
    r = new Runner(run, { onChange: notify, onLog: (m) => console.info('[crowdlab]', m) });
    runners.set(run.id, r);
  }
  return r;
}

export function peekRunner(id: string): Runner | undefined {
  return runners.get(id);
}

export async function registerRun(run: Run) {
  runs.set(run.id, run);
  await saveRun(run);
  notify();
}

export async function persistRun(run: Run) {
  notify();
  await saveRun(run);
}

export function useRun(id: string): { run?: Run; loading: boolean } {
  useVersion();
  const present = runs.has(id);
  const [loading, setLoading] = useState(!present);
  useEffect(() => {
    if (present) {
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    loadRun(id).then((r) => {
      if (!alive) return;
      if (r) {
        if (r.status === 'running') r.status = 'paused';
        runs.set(id, r);
      }
      setLoading(false);
      notify();
    });
    return () => {
      alive = false;
    };
  }, [id, present]);
  return { run: runs.get(id), loading };
}

export function forgetRun(id: string) {
  runners.get(id)?.stop();
  runners.delete(id);
  runs.delete(id);
  notify();
}
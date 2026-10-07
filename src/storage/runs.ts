import { del, get, set } from 'idb-keyval';
import type { Run, RunMeta } from '@/domain/types';
import { buildRows, stats } from '@/domain/aggregate';

const INDEX = 'crowdlab:index';

export async function listRuns(): Promise<RunMeta[]> {
  return ((await get(INDEX)) as RunMeta[] | undefined) ?? [];
}

export async function loadRun(id: string): Promise<Run | undefined> {
  return (await get(`crowdlab:run:${id}`)) as Run | undefined;
}

export function metaOf(run: Run): RunMeta {
  const rows = buildRows(run).filter((r) => r.a);
  const pay = stats(rows.map((r) => r.a!.prob.pay));
  const tr = stats(rows.map((r) => r.a!.prob.try));
  return {
    id: run.id,
    title: run.title,
    createdAt: run.createdAt,
    status: run.status,
    n: run.personas.length,
    ok: rows.length,
    spent: run.spent,
    payMean: pay.n ? pay.mean : null,
    tryMean: tr.n ? tr.mean : null,
    outcome: run.outcome,
  };
}

export async function saveRun(run: Run): Promise<void> {
  await set(`crowdlab:run:${run.id}`, run);
  const idx = await listRuns();
  const meta = metaOf(run);
  const i = idx.findIndex((m) => m.id === run.id);
  if (i >= 0) idx[i] = meta;
  else idx.unshift(meta);
  await set(INDEX, idx);
}

export async function deleteRun(id: string): Promise<void> {
  await del(`crowdlab:run:${id}`);
  const idx = (await listRuns()).filter((m) => m.id !== id);
  await set(INDEX, idx);
}

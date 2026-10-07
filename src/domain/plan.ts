import { makeRng } from './rng';
import type { CallKind, Run, VariantId } from './types';

export interface Task {
  key: string;
  personaId: string;
  variant: VariantId;
  kind: CallKind;
}

export function retestIds(run: Run): Set<string> {
  const k = Math.round(run.personas.length * run.config.cost.retestShare);
  const rng = makeRng(run.config.seed + 101);
  return new Set(rng.shuffle(run.personas.map((p) => p.id)).slice(0, k));
}

export function plannedTasks(run: Run): Task[] {
  const tasks: Task[] = [];
  const rt = retestIds(run);
  for (const p of run.personas) {
    tasks.push({ key: `${p.id}|A|main`, personaId: p.id, variant: 'A', kind: 'main' });
    if (run.config.variantB.enabled) tasks.push({ key: `${p.id}|B|main`, personaId: p.id, variant: 'B', kind: 'main' });
  }
  for (const p of run.personas) {
    if (rt.has(p.id)) tasks.push({ key: `${p.id}|A|retest`, personaId: p.id, variant: 'A', kind: 'retest' });
  }
  return tasks;
}

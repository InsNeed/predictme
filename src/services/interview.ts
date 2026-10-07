import { costOf } from '@/domain/pricing';
import { buildUser, interviewSystem } from '@/domain/prompts';
import { makeRng } from '@/domain/rng';
import type { CallRecord, Persona, Run, VariantId } from '@/domain/types';
import { chat, type ChatMessage } from './deepseek';

export async function askPersona(
  run: Run,
  persona: Persona,
  variant: VariantId,
  rec: CallRecord,
  history: ChatMessage[],
): Promise<{ content: string; cost: number }> {
  const user = buildUser(run.config, variant, persona, makeRng(1), undefined, rec.optionOrder).text;
  const res = await chat({
    model: run.config.cost.model,
    thinking: 'off',
    temperature: 0.9,
    maxTokens: 600,
    messages: [
      { role: 'system', content: interviewSystem(run.config, variant, persona) },
      { role: 'user', content: user },
      { role: 'assistant', content: JSON.stringify(rec.answer) },
      ...history,
    ],
  });
  return { content: res.content.trim(), cost: costOf(run.config.cost.model, res.usage) };
}

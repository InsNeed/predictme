import type { Filters } from '@/domain/aggregate';
import { costOf } from '@/domain/pricing';
import { reportMessages } from '@/domain/report';
import type { ModelId, Run } from '@/domain/types';
import { chatStream } from './deepseek';

export async function generateReport(
  run: Run,
  filters: Filters | null,
  model: ModelId,
  scope: string,
  onDelta: (content: string, reasoning: string) => void,
  signal?: AbortSignal,
): Promise<{ markdown: string; cost: number }> {
  const res = await chatStream(
    {
      model,
      thinking: 'high',
      maxTokens: 32000,
      signal,
      messages: reportMessages(run, filters, scope),
    },
    onDelta,
  );
  const cost = costOf(model, res.usage);
  if (!res.content.trim()) throw new Error(res.finish === 'length' ? '思考用完了长度上限，没有写出正文' : '模型没有返回正文');
  const markdown = res.finish === 'length' ? `${res.content}\n\n> 报告在长度上限处被截断。` : res.content;
  return { markdown, cost };
}

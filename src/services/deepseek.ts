import type { ModelId, ThinkingLevel, Usage } from '@/domain/types';
import { getApiKey } from '@/storage/settings';

const BASE = 'https://api.deepseek.com';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  model: ModelId;
  messages: ChatMessage[];
  thinking: ThinkingLevel;
  temperature?: number;
  maxTokens: number;
  json?: boolean;
  signal?: AbortSignal;
}

export interface ChatResult {
  content: string;
  reasoning: string;
  usage: Usage;
  finish: string;
}

export class ApiError extends Error {
  constructor(message: string, public status: number, public retryable: boolean) {
    super(message);
  }
}

function requestBody(o: ChatOptions, stream: boolean): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: o.model,
    messages: o.messages,
    max_tokens: o.maxTokens,
    stream,
  };
  if (stream) body.stream_options = { include_usage: true };
  if (o.json) body.response_format = { type: 'json_object' };
  if (o.thinking === 'off') {
    body.thinking = { type: 'disabled' };
    if (o.temperature != null) body.temperature = o.temperature;
  } else {
    body.reasoning_effort = o.thinking;
  }
  return body;
}

function usageOf(u: Record<string, any> | undefined): Usage {
  u = u ?? {};
  return {
    hit: u.prompt_cache_hit_tokens ?? 0,
    miss: u.prompt_cache_miss_tokens ?? u.prompt_tokens ?? 0,
    out: u.completion_tokens ?? 0,
    reasoning: u.completion_tokens_details?.reasoning_tokens ?? 0,
  };
}

async function post(o: ChatOptions, body: Record<string, unknown>): Promise<Response> {
  const key = getApiKey();
  if (!key) throw new ApiError('没有设置 DeepSeek 密钥，请到「设置」里填写', 0, false);
  let res: Response;
  try {
    res = await fetch(`${BASE}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify(body),
      signal: o.signal,
    });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    throw new ApiError(`网络错误：${(e as Error).message}`, 0, true);
  }
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      msg = j?.error?.message ? `${msg}：${j.error.message}` : msg;
    } catch { /* 响应体不是 JSON */ }
    const retryable = res.status === 429 || res.status >= 500;
    if (res.status === 401) msg = '密钥无效（401）';
    if (res.status === 402) msg = '余额不足（402），请充值后继续';
    throw new ApiError(msg, res.status, retryable);
  }
  return res;
}

export async function chat(o: ChatOptions): Promise<ChatResult> {
  const res = await post(o, requestBody(o, false));
  const data = await res.json();
  const choice = data?.choices?.[0];
  return {
    content: choice?.message?.content ?? '',
    reasoning: choice?.message?.reasoning_content ?? '',
    usage: usageOf(data?.usage),
    finish: choice?.finish_reason ?? '',
  };
}

export async function chatStream(o: ChatOptions, onDelta: (content: string, reasoning: string) => void): Promise<ChatResult> {
  const res = await post(o, requestBody(o, true));
  if (!res.body) throw new ApiError('浏览器不支持流式读取', 0, false);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let content = '';
  let reasoning = '';
  let finish = '';
  let usage = usageOf(undefined);
  for (;;) {
    let chunk: ReadableStreamReadResult<Uint8Array>;
    try {
      chunk = await reader.read();
    } catch (e) {
      if ((e as Error).name === 'AbortError') throw e;
      throw new ApiError(`网络中断：${(e as Error).message}`, 0, true);
    }
    if (chunk.done) break;
    buf += decoder.decode(chunk.value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';
    let changed = false;
    for (const line of lines) {
      const t = line.trim();
      if (!t.startsWith('data:')) continue;
      const payload = t.slice(5).trim();
      if (payload === '[DONE]') continue;
      let j: any;
      try {
        j = JSON.parse(payload);
      } catch {
        continue;
      }
      const c = j?.choices?.[0];
      if (c?.delta?.content) { content += c.delta.content; changed = true; }
      if (c?.delta?.reasoning_content) { reasoning += c.delta.reasoning_content; changed = true; }
      if (c?.finish_reason) finish = c.finish_reason;
      if (j?.usage) usage = usageOf(j.usage);
    }
    if (changed) onDelta(content, reasoning);
  }
  return { content, reasoning, usage, finish };
}

export async function fetchBalance(): Promise<string | null> {
  const key = getApiKey();
  if (!key) return null;
  try {
    const res = await fetch(`${BASE}/user/balance`, { headers: { Authorization: `Bearer ${key}` } });
    if (!res.ok) return null;
    const j = await res.json();
    const cny = j?.balance_infos?.find((b: { currency: string }) => b.currency === 'CNY');
    return cny ? `¥${cny.total_balance}` : null;
  } catch {
    return null;
  }
}

export function parseJsonLoose(text: string): unknown {
  let t = text.trim();
  t = t.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const s = t.indexOf('{');
  const e = t.lastIndexOf('}');
  if (s >= 0 && e > s) t = t.slice(s, e + 1);
  return JSON.parse(t);
}

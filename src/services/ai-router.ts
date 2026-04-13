/**
 * Hybrid AI router — routes calls across Gemini Flash / Gemini 2.5 Pro / Claude Sonnet 4.5
 * by `tier` parameter. Single entry point for the entire app.
 */

export type Tier = 'fast' | 'reason' | 'judge';

export interface RouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface RouterCall {
  tier: Tier;
  messages: RouterMessage[];
  schema?: any;          // JSON schema for structured output
  schemaName?: string;
  temperature?: number;
  maxTokens?: number;
}

// Vite replaces `process.env.OPENROUTER_API_KEY` at build time via vite.config define.
// Also try import.meta.env as a fallback (when VITE_ prefix is used).
const OPENROUTER_KEY: string =
  (process.env.OPENROUTER_API_KEY as string) ||
  ((import.meta as any).env?.VITE_OPENROUTER_API_KEY as string) ||
  '';

const MODEL_BY_TIER: Record<Tier, string> = {
  fast:   'google/gemini-2.0-flash-001',
  reason: 'google/gemini-2.0-pro-exp-02-05:free',
  judge:  'anthropic/claude-3.5-sonnet',
};

const FALLBACK_BY_TIER: Record<Tier, string> = {
  fast:   'google/gemini-2.0-flash-001',
  reason: 'google/gemini-2.0-flash-001',
  judge:  'google/gemini-2.0-flash-001',
};

// Simple in-memory cost guardrail
const callCounts: Record<Tier, number> = { fast: 0, reason: 0, judge: 0 };
const DAILY_LIMITS: Record<Tier, number> = { fast: 10000, reason: 200, judge: 80 };

function checkBudget(tier: Tier) {
  callCounts[tier] += 1;
  if (callCounts[tier] > DAILY_LIMITS[tier]) {
    // eslint-disable-next-line no-console
    console.warn(`[ai-router] tier=${tier} approached daily soft limit (${DAILY_LIMITS[tier]})`);
  }
}

async function postOpenRouter(model: string, body: any): Promise<any> {
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://medai.local',
      'X-Title': 'MedAI Learning Platform',
    },
    body: JSON.stringify({ ...body, model }),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err?.error?.message || `OpenRouter ${r.status}`);
  }
  return r.json();
}

export async function callAI<T = any>(req: RouterCall): Promise<T | string> {
  if (!OPENROUTER_KEY) throw new Error('OPENROUTER_API_KEY missing');
  checkBudget(req.tier);

  const body: any = {
    messages: req.messages.map(m => ({ role: m.role === 'system' ? 'system' : m.role, content: m.content })),
    temperature: req.temperature ?? (req.tier === 'fast' ? 0.4 : 0.2),
  };
  if (req.maxTokens) body.max_tokens = req.maxTokens;

  if (req.schema) {
    body.response_format = {
      type: 'json_schema',
      json_schema: {
        name: req.schemaName || 'response',
        strict: true,
        schema: req.schema,
      },
    };
  }

  let data: any;
  try {
    data = await postOpenRouter(MODEL_BY_TIER[req.tier], body);
  } catch (e) {
    // Fallback to fast tier on failure
    if (req.tier !== 'fast') {
      // eslint-disable-next-line no-console
      console.warn(`[ai-router] tier=${req.tier} failed, falling back to ${FALLBACK_BY_TIER[req.tier]}`, e);
      data = await postOpenRouter(FALLBACK_BY_TIER[req.tier], body);
    } else {
      throw e;
    }
  }

  const content = data.choices?.[0]?.message?.content ?? '';

  if (req.schema) {
    try {
      return JSON.parse(content) as T;
    } catch {
      // Best-effort: attempt to extract JSON from a fenced block
      const m = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (m) return JSON.parse(m[1]) as T;
      throw new Error('AI returned invalid JSON');
    }
  }
  return content as string;
}

// Convenience helpers
export const fast   = <T = any>(req: Omit<RouterCall, 'tier'>) => callAI<T>({ ...req, tier: 'fast' });
export const reason = <T = any>(req: Omit<RouterCall, 'tier'>) => callAI<T>({ ...req, tier: 'reason' });
export const judge  = <T = any>(req: Omit<RouterCall, 'tier'>) => callAI<T>({ ...req, tier: 'judge' });

export function getCallStats() {
  return { ...callCounts };
}

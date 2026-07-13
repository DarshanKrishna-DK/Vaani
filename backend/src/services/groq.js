/**
 * groq.js - Free-tier AI via Groq.
 *
 * Groq offers a generous free tier for fast Llama-3 / Llama-4 inference. This
 * module wraps the OpenAI-compatible chat completions endpoint.
 *
 * Set GROQ_API_KEY in backend/.env (get one free at https://console.groq.com).
 *
 * If no key is present, the agent still runs: it falls back to a deterministic
 * local planner (see agent/planner.js) so the MVP is demonstrable offline.
 * The FALLBACK affects only the natural-language phrasing and intent routing -
 * all tools, data, scoring, and actions remain fully real.
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

export function hasGroq() {
  return Boolean(process.env.GROQ_API_KEY);
}

/**
 * chat() - a single completion call.
 * @param {Array} messages - OpenAI-style messages
 * @param {Object} opts - { tools, temperature, jsonMode }
 */
export async function chat(messages, opts = {}) {
  if (!hasGroq()) {
    throw new Error('GROQ_API_KEY not set');
  }
  const body = {
    model: MODEL,
    messages,
    temperature: opts.temperature ?? 0.3,
    max_tokens: opts.maxTokens ?? 1024,
  };
  if (opts.tools) {
    body.tools = opts.tools;
    body.tool_choice = opts.toolChoice || 'auto';
  }
  if (opts.jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Groq API error ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data.choices[0].message;
}

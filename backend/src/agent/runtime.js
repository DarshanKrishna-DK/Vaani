/**
 * runtime.js - The Orchestration Layer (agent runtime).
 *
 * This is where an utterance becomes an action. Flow:
 *   1. Receive user text + language + user id + short conversation memory.
 *   2. If Groq is configured: run an LLM tool-use loop. The model chooses a
 *      tool, we execute the REAL tool, feed the result back, and let the model
 *      compose a natural reply in the user's language.
 *   3. If Groq is NOT configured: use the deterministic planner to pick a tool,
 *      execute it, and template a reply.
 *
 * In both paths the tools are identical and fully real. Confirmation-gated
 * tools (transfer_money, file_dispute) never execute a state change until the
 * user confirms - the runtime surfaces a needsConfirmation reply and waits.
 */

import { chat, hasGroq } from '../services/groq.js';
import { TOOL_SCHEMAS, TOOLS } from '../tools/tools.js';
import { planLocally } from './planner.js';
import { getUser, getLifeContext, appendAudit } from '../services/store.js';

const LANG_NAMES = { hi: 'Hindi', en: 'English', hinglish: 'Hinglish (Hindi + English mix)', ta: 'Tamil', mr: 'Marathi' };

function systemPrompt(user, language) {
  const langName = LANG_NAMES[language] || 'the user\'s language';
  const ctx = getLifeContext(user.id)
    .map((c) => `- ${c.label}: ${c.note}`)
    .join('\n');
  return `You are Vaani, a hands-free banking assistant for IDBI Bank customers in India.
You are talking to ${user.name}, a ${user.occupation} from ${user.city}.
Reply in ${langName}. Keep replies short, warm, and spoken-word friendly (this is read aloud).
Never invent numbers - always use a tool to fetch real data. Money and rupee amounts must come from tool results only.
Before any transfer or dispute you MUST get explicit user confirmation; call the tool with confirmed=false first to ask, then confirmed=true only after the user agrees.
Explain jargon simply when asked, using the explain_term tool.

What you remember about ${user.name}:
${ctx || '- (nothing yet)'}`;
}

/**
 * Run one turn. history is [{role, content}] of prior turns (optional).
 * Returns { reply, toolCalls, action, needsConfirmation, data }.
 */
export async function runTurn({ userId, text, language, history = [] }) {
  const user = getUser(userId);
  if (!user) return { reply: 'User not found.', error: true };

  const lang = language || user.preferredLanguage;
  appendAudit({ userId, kind: 'utterance', action: 'user_message', detail: { text } });

  if (hasGroq()) {
    return runWithLLM({ user, text, lang, history });
  }
  return runWithFallback({ user, text, lang });
}

// ---------------- LLM path ----------------
async function runWithLLM({ user, text, lang, history }) {
  const messages = [
    { role: 'system', content: systemPrompt(user, lang) },
    ...history.slice(-6),
    { role: 'user', content: text },
  ];

  const toolCallsMade = [];
  let lastToolResult = null;

  // Up to 3 tool-use rounds
  for (let round = 0; round < 3; round++) {
    const msg = await chat(messages, { tools: TOOL_SCHEMAS, temperature: 0.3 });

    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      // Final natural-language answer
      return {
        reply: msg.content || lastToolResult?.summary || 'Done.',
        toolCalls: toolCallsMade,
        needsConfirmation: lastToolResult?.needsConfirmation || false,
        action: lastToolResult?.data?.action || null,
        data: lastToolResult?.data || null,
      };
    }

    messages.push(msg);

    for (const tc of msg.tool_calls) {
      const name = tc.function.name;
      let args = {};
      try {
        args = JSON.parse(tc.function.arguments || '{}');
      } catch {
        args = {};
      }
      const impl = TOOLS[name];
      const result = impl ? impl(user.id, args) : { ok: false, summary: `Unknown tool ${name}` };
      lastToolResult = result;
      toolCallsMade.push({ name, args, result: { ok: result.ok, summary: result.summary } });

      messages.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: JSON.stringify({ summary: result.summary, data: result.data, needsConfirmation: result.needsConfirmation, needsInput: result.needsInput }),
      });

      // If the tool needs confirmation, stop and surface it immediately
      if (result.needsConfirmation || result.needsInput) {
        const followup = await chat(messages, { temperature: 0.3 });
        return {
          reply: followup.content || result.summary,
          toolCalls: toolCallsMade,
          needsConfirmation: result.needsConfirmation || false,
          needsInput: result.needsInput || false,
          action: result.data?.action || null,
          data: result.data || null,
        };
      }
    }
  }

  // Ran out of rounds - return the last tool summary
  return {
    reply: lastToolResult?.summary || 'Done.',
    toolCalls: toolCallsMade,
    data: lastToolResult?.data || null,
  };
}

// ---------------- Fallback path ----------------
function runWithFallback({ user, text, lang }) {
  const plan = planLocally(text);
  if (!plan.tool) {
    return {
      reply: fallbackGreeting(user, lang, text),
      toolCalls: [],
      data: null,
      fallback: true,
    };
  }
  const impl = TOOLS[plan.tool];
  const result = impl(user.id, plan.args);
  return {
    reply: result.summary,
    toolCalls: [{ name: plan.tool, args: plan.args, result: { ok: result.ok, summary: result.summary } }],
    needsConfirmation: result.needsConfirmation || false,
    needsInput: result.needsInput || false,
    action: result.data?.action || null,
    data: result.data || null,
    fallback: true,
  };
}

function fallbackGreeting(user, lang, text) {
  if (/^\s*(hi|hello|namaste|namaskar|vanakkam|hey|hola)\b/i.test(text)) {
    const greet = { hi: `Namaste ${user.name.split(' ')[0]}! Main aapki kya madad karun?`, en: `Hello ${user.name.split(' ')[0]}! How can I help you?`, hinglish: `Namaste ${user.name.split(' ')[0]}! Bataiye, kya help karun?`, ta: `Vanakkam ${user.name.split(' ')[0]}! Naan eppadi udhava mudiyum?`, mr: `Namaskar ${user.name.split(' ')[0]}! Mi kashi madat karu?` };
    return greet[lang] || greet.en;
  }
  return "I can help with your balance, transactions, transfers, upcoming bills, financial health, disputes, or explaining any banking term. What would you like to do?";
}

/**
 * planner.js - Deterministic fallback planner.
 *
 * When GROQ_API_KEY is not configured, the agent uses this rule-based planner
 * to route an utterance to a tool. It is intentionally simple keyword matching
 * across English, Hindi, and Hinglish. This keeps the MVP fully demonstrable
 * with zero external credentials.
 *
 * IMPORTANT: only intent *routing* is heuristic here. The tools it calls are
 * the same real tools the LLM planner uses. No data or action is faked.
 */

const RULES = [
  { tool: 'get_balance', patterns: ['balance', 'kitne paise', 'kitna paisa', 'how much money', 'bache hain', 'account me', 'paisa hai'] },
  { tool: 'get_mini_statement', patterns: ['statement', 'last transaction', 'recent', 'transactions', 'kya kharcha', 'mini statement', 'history'] },
  { tool: 'get_upcoming_dues', patterns: ['due', 'bill', 'emi', 'upcoming', 'kab hai', 'payment', 'mandate', 'auto debit', 'autopay'] },
  { tool: 'get_health_score', patterns: ['health score', 'financial health', 'how am i doing', 'money check', 'financially'] },
  { tool: 'get_spend_breakdown', patterns: ['spend', 'breakdown', 'where is my money', 'kharcha', 'category', 'kis cheez'] },
  { tool: 'transfer_money', patterns: ['send', 'transfer', 'pay ', 'paisa bhej', 'bhejo', 'bhej do', 'transfer kar'] },
  { tool: 'file_dispute', patterns: ['dispute', 'wrong charge', 'galat', 'refund', 'nahi kiya', 'fraud', 'unknown transaction'] },
  { tool: 'explain_term', patterns: ['what is', 'what does', 'explain', 'kya hota hai', 'matlab', 'meaning of', 'kya hai'] },
  { tool: 'remember_context', patterns: ['remember', 'yaad rakh', 'note that', 'dont forget', 'yaad rakhna'] },
];

const TERMS = ['sip', 'fd', 'rd', 'emi', 'elss', 'mclr', 'dpd', 'moratorium', 'kcc', 'cibil', 'fixed deposit', 'recurring deposit', 'kisan credit card'];

export function planLocally(utterance) {
  const text = utterance.toLowerCase();

  // Explain term takes priority if a known term is mentioned with a question
  if (/what|explain|matlab|kya h|meaning|kya hota/.test(text)) {
    const found = TERMS.find((t) => text.includes(t));
    if (found) return { tool: 'explain_term', args: { term: found } };
  }

  for (const rule of RULES) {
    if (rule.patterns.some((p) => text.includes(p))) {
      return { tool: rule.tool, args: extractArgs(rule.tool, text) };
    }
  }

  // No match
  return { tool: null, args: {} };
}

function extractArgs(tool, text) {
  const confirmed = /\b(confirm|confirmed|haan|yes|ok|okay|kar do|kardo|proceed|go ahead)\b/.test(text);
  if (tool === 'transfer_money') {
    const amount = extractAmount(text);
    const payee = extractPayee(text);
    return { payee, amount, confirmed };
  }
  if (tool === 'file_dispute') {
    return { confirmed };
  }
  if (tool === 'get_mini_statement') {
    const m = text.match(/(\d+)/);
    return { count: m ? parseInt(m[1], 10) : 5 };
  }
  if (tool === 'explain_term') {
    const found = TERMS.find((t) => text.includes(t));
    return { term: found || text.replace(/what is|what does|explain|mean|matlab|kya hota hai|kya hai/g, '').trim() };
  }
  return {};
}

function extractAmount(text) {
  // handles "500", "rs 500", "500 rupees", "5000rs"
  const m = text.replace(/,/g, '').match(/(?:rs\.?\s*)?(\d{2,7})/);
  return m ? parseInt(m[1], 10) : null;
}

function extractPayee(text) {
  // crude: word after "to" / "ko"
  let m = text.match(/(?:to|ko)\s+([a-z]+)/);
  if (m) return m[1];
  return '';
}

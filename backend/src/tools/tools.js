/**
 * tools.js - The Tools & Skills layer.
 *
 * Each tool is a real function operating on live data. The agent's LLM planner
 * selects and calls these; nothing here is mocked. Tools also emit audit-log
 * entries so every action has provenance.
 *
 * Exposed as:
 *   - TOOL_SCHEMAS: OpenAI/Groq function-calling schemas for the planner
 *   - TOOLS: the executable implementations keyed by name
 */

import {
  getPrimaryAccount,
  getAccounts,
  getTransactions,
  getPayees,
  findPayee,
  addTransaction,
  getMandates,
  getLifeContext,
  addLifeContext,
  createDispute,
  appendAudit,
} from '../services/store.js';
import { computeHealthScore, computeSpendBreakdown } from '../services/healthScore.js';
import { explainTerm } from '../services/explain.js';

function inr(n) {
  return 'Rs. ' + Math.abs(n).toLocaleString('en-IN');
}

export const TOOL_SCHEMAS = [
  {
    type: 'function',
    function: {
      name: 'get_balance',
      description: "Get the customer's current account balance(s). Use for questions like how much money is left, kitne paise hain, balance check.",
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_mini_statement',
      description: 'Get the most recent transactions. Use for last transactions, mini statement, recent spends, what did I spend on.',
      parameters: {
        type: 'object',
        properties: { count: { type: 'integer', description: 'How many recent transactions to return (default 5)' } },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'transfer_money',
      description: 'Transfer money to a payee by name or UPI id. ALWAYS confirm with the user before executing. Use for send money, transfer, pay someone, paisa bhejo.',
      parameters: {
        type: 'object',
        properties: {
          payee: { type: 'string', description: 'Name or UPI id of the recipient' },
          amount: { type: 'number', description: 'Amount in rupees' },
          confirmed: { type: 'boolean', description: 'Set true only after the user has explicitly confirmed the transfer' },
        },
        required: ['payee', 'amount'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_upcoming_dues',
      description: 'List upcoming scheduled debits, EMIs, bills and mandates. Use for what bills are due, upcoming payments, EMI kab hai.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_health_score',
      description: "Compute the customer's Financial Health Score and insights. Use for how am I doing financially, financial health, money check.",
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_spend_breakdown',
      description: 'Break down spending by category over the last month. Use for where is my money going, spending breakdown, kis cheez pe kharcha.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'explain_term',
      description: 'Explain a financial/banking term in plain language, grounded in the user\'s own data where relevant. Use whenever the user asks what does X mean (SIP, ELSS, EMI, MCLR, RD, FD, DPD, moratorium, KCC etc.).',
      parameters: {
        type: 'object',
        properties: { term: { type: 'string', description: 'The term to explain' } },
        required: ['term'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'file_dispute',
      description: 'File a dispute for a transaction the user does not recognise or believes is wrong. Confirm the transaction first. Use for dispute, wrong charge, galat paisa kata.',
      parameters: {
        type: 'object',
        properties: {
          transactionId: { type: 'string', description: 'The id of the transaction to dispute' },
          reason: { type: 'string', description: 'Why the user is disputing it' },
          confirmed: { type: 'boolean', description: 'Set true only after the user confirms filing the dispute' },
        },
        required: ['transactionId', 'reason'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'remember_context',
      description: "Save a personal life-context fact the user shares (a family commitment, a goal, a recurring need) so Vaani can plan around it later. Use for remember that, yaad rakhna.",
      parameters: {
        type: 'object',
        properties: {
          label: { type: 'string', description: 'Short label for the fact' },
          note: { type: 'string', description: 'Details' },
        },
        required: ['label', 'note'],
      },
    },
  },
];

// ---- Executable implementations. Each returns { ok, summary, data } ----
export const TOOLS = {
  get_balance: (userId) => {
    const accounts = getAccounts(userId);
    const lines = accounts.map((a) => `${labelType(a.type)} (${a.number}): ${a.balance < 0 ? '-' : ''}${inr(a.balance)}`);
    const primary = getPrimaryAccount(userId);
    appendAudit({ userId, kind: 'read', action: 'get_balance' });
    return {
      ok: true,
      summary: `Your balance is ${inr(primary.balance)} in your savings account.`,
      data: { accounts, primaryBalance: primary.balance, lines },
    };
  },

  get_mini_statement: (userId, args = {}) => {
    const count = args.count || 5;
    const txns = getTransactions(userId, { limit: count });
    appendAudit({ userId, kind: 'read', action: 'get_mini_statement' });
    return {
      ok: true,
      summary: `Here are your last ${txns.length} transactions.`,
      data: {
        transactions: txns.map((t) => ({
          date: t.date,
          desc: t.desc,
          amount: t.amount,
          type: t.type,
          category: t.category,
        })),
      },
    };
  },

  transfer_money: (userId, args = {}) => {
    const { payee, amount, confirmed } = args;
    const primary = getPrimaryAccount(userId);
    const found = findPayee(userId, String(payee || ''));

    if (!found) {
      return {
        ok: false,
        needsInput: true,
        summary: `I could not find a saved payee matching "${payee}". Who would you like to send ${inr(amount)} to?`,
        data: { payees: getPayees(userId) },
      };
    }
    if (!amount || amount <= 0) {
      return { ok: false, needsInput: true, summary: 'How much would you like to send?', data: { payee: found } };
    }
    if (amount > primary.balance) {
      return {
        ok: false,
        summary: `Your balance (${inr(primary.balance)}) is not enough to send ${inr(amount)}.`,
        data: { balance: primary.balance, requested: amount, shortfall: Math.round(amount - primary.balance) },
      };
    }
    if (!confirmed) {
      // Ask for confirmation before moving real money
      return {
        ok: false,
        needsConfirmation: true,
        summary: `Please confirm: send ${inr(amount)} to ${found.name} (${found.upiId})?`,
        data: { payee: found, amount, action: 'transfer_money' },
      };
    }
    // Execute the real transfer
    const txn = addTransaction({
      userId,
      accountId: primary.id,
      desc: `UPI - ${found.name}`,
      category: 'transfer',
      amount: -Math.abs(amount),
      type: 'debit',
    });
    appendAudit({ userId, kind: 'action', action: 'transfer_money', detail: { payee: found.name, amount, txnId: txn.id } });
    return {
      ok: true,
      summary: `Done. ${inr(amount)} sent to ${found.name}. Your new balance is ${inr(getPrimaryAccount(userId).balance)}.`,
      data: { txn, newBalance: getPrimaryAccount(userId).balance, payee: found },
    };
  },

  get_upcoming_dues: (userId) => {
    const mandates = getMandates(userId);
    appendAudit({ userId, kind: 'read', action: 'get_upcoming_dues' });
    return {
      ok: true,
      summary: `You have ${mandates.length} upcoming scheduled payments.`,
      data: {
        dues: mandates.map((m) => ({
          payee: m.payee,
          amount: m.amount,
          nextDebit: m.nextDebit,
          type: m.type,
        })),
      },
    };
  },

  get_health_score: (userId) => {
    const score = computeHealthScore(userId);
    appendAudit({ userId, kind: 'read', action: 'get_health_score' });
    return {
      ok: true,
      summary: `Your Financial Health Score is ${score.overall} out of 100 (grade ${score.grade}).`,
      data: score,
    };
  },

  get_spend_breakdown: (userId) => {
    const breakdown = computeSpendBreakdown(userId);
    appendAudit({ userId, kind: 'read', action: 'get_spend_breakdown' });
    const top = breakdown[0];
    return {
      ok: true,
      summary: top ? `Your biggest spend category this month is ${top.category} at ${inr(top.amount)}.` : 'No spending recorded this month.',
      data: { breakdown },
    };
  },

  explain_term: (userId, args = {}) => {
    const result = explainTerm(userId, String(args.term || ''));
    appendAudit({ userId, kind: 'read', action: 'explain_term', detail: { term: args.term } });
    return { ok: true, summary: result.explanation, data: result };
  },

  file_dispute: (userId, args = {}) => {
    const { transactionId, reason, confirmed } = args;
    const txns = getTransactions(userId, { limit: 500 });
    const txn = txns.find((t) => t.id === transactionId);
    if (!txn) {
      return {
        ok: false,
        needsInput: true,
        summary: 'Which transaction would you like to dispute? I can read out your recent transactions.',
        data: { transactions: txns.slice(0, 5) },
      };
    }
    if (!confirmed) {
      return {
        ok: false,
        needsConfirmation: true,
        summary: `Please confirm: file a dispute for "${txn.desc}" of ${inr(txn.amount)}? Reason: ${reason}.`,
        data: { transaction: txn, reason, action: 'file_dispute' },
      };
    }
    const dispute = createDispute({ userId, transactionId, reason });
    appendAudit({ userId, kind: 'action', action: 'file_dispute', detail: { caseId: dispute.id, transactionId } });
    return {
      ok: true,
      summary: `Your dispute is filed. Case ID is ${dispute.id}. You should hear back within 7 working days.`,
      data: { dispute },
    };
  },

  remember_context: (userId, args = {}) => {
    const item = addLifeContext(userId, { label: args.label, note: args.note, nextDate: null });
    appendAudit({ userId, kind: 'action', action: 'remember_context', detail: { label: args.label } });
    return { ok: true, summary: `Got it. I'll remember: ${args.label}.`, data: { item } };
  },
};

function labelType(type) {
  return { savings: 'Savings', recurring_deposit: 'Recurring Deposit', kcc: 'Kisan Credit Card', current: 'Current' }[type] || type;
}

/**
 * explain.js - The Explain Engine.
 *
 * Demystifies financial jargon in plain language, grounded in the user's own
 * numbers where possible. The base definitions are a curated knowledge base;
 * the *grounding* (the worked example using the user's real balance/spend) is
 * computed dynamically. When Groq is available, the agent layer can further
 * rephrase this into the user's language - but the factual content and the
 * personalised example come from here.
 */

import { getPrimaryAccount, getTransactions } from './store.js';

const KB = {
  sip: {
    term: 'SIP (Systematic Investment Plan)',
    plain: 'A SIP means putting a small fixed amount into a mutual fund automatically every month, instead of one big amount. It builds wealth slowly and evens out market ups and downs.',
    ground: (u) => `For example, if you set aside Rs. 1,000 every month, that is Rs. 12,000 a year going to work for you - roughly the size of one of your recent trip payments.`,
  },
  fd: {
    term: 'FD (Fixed Deposit)',
    plain: 'An FD is money you lock in the bank for a fixed time at a fixed interest rate. It is very safe and pays more than a normal savings account.',
    ground: (u, bal) => `If you moved Rs. ${Math.round(bal * 0.5).toLocaleString('en-IN')} of your balance into a 1-year FD at about 7%, you would earn roughly Rs. ${Math.round(bal * 0.5 * 0.07).toLocaleString('en-IN')} extra in a year.`,
  },
  rd: {
    term: 'RD (Recurring Deposit)',
    plain: 'An RD is like an FD but you add a small fixed amount every month. Good for building a habit of saving from regular income.',
    ground: () => `For instance, Rs. 2,000 a month for a year is Rs. 24,000 saved, plus interest on top.`,
  },
  emi: {
    term: 'EMI (Equated Monthly Instalment)',
    plain: 'An EMI is the fixed amount you repay every month on a loan. Part of it pays interest, part reduces what you borrowed.',
    ground: (u, bal, txns) => {
      const emi = txns.find((t) => t.category === 'emi');
      return emi ? `Your truck loan EMI of Rs. ${Math.abs(emi.amount).toLocaleString('en-IN')} is an example - it is fixed each month until the loan is cleared.` : '';
    },
  },
  elss: {
    term: 'ELSS (Equity Linked Savings Scheme)',
    plain: 'ELSS is a type of mutual fund that also saves you income tax. Your money stays invested for at least 3 years.',
    ground: () => `It suits you if you pay income tax and can leave the money untouched for a few years.`,
  },
  mclr: {
    term: 'MCLR (Marginal Cost of Funds based Lending Rate)',
    plain: 'MCLR is the lowest interest rate a bank can lend at. Your loan rate is usually MCLR plus a small margin. If MCLR falls, your loan can get cheaper.',
    ground: () => `It matters because it decides how much interest you pay on loans like a truck or business loan.`,
  },
  dpd: {
    term: 'DPD (Days Past Due)',
    plain: 'DPD counts how many days a loan payment is late. Keeping it at zero protects your credit score and future loan approvals.',
    ground: () => `Paying EMIs on time keeps your DPD at zero, which keeps your borrowing power healthy.`,
  },
  moratorium: {
    term: 'EMI Moratorium',
    plain: 'A moratorium is a temporary pause on loan EMIs, usually in hardship. Interest still adds up, so it is a breather, not free money.',
    ground: () => `Useful in a tough month, but the paused amount plus interest is added back later.`,
  },
  kcc: {
    term: 'KCC (Kisan Credit Card)',
    plain: 'A KCC gives farmers a flexible credit limit for crop and farm needs at low interest. You borrow what you need and repay after harvest.',
    ground: () => `It is meant for agricultural expenses like seeds, fertiliser, and equipment.`,
  },
  cibil: {
    term: 'CIBIL Score',
    plain: 'Your CIBIL score is a 3-digit number (300-900) that shows how reliably you repay loans. Higher is better and gets you cheaper loans.',
    ground: () => `Paying bills and EMIs on time steadily improves it.`,
  },
};

const ALIASES = {
  'systematic investment plan': 'sip',
  'fixed deposit': 'fd',
  'recurring deposit': 'rd',
  'kisan credit card': 'kcc',
  'days past due': 'dpd',
};

export function explainTerm(userId, rawTerm) {
  const key = normalise(rawTerm);
  const entry = KB[key];
  const primary = getPrimaryAccount(userId);
  const txns = getTransactions(userId, { limit: 100, sinceDays: 45 });

  if (!entry) {
    return {
      term: rawTerm,
      known: false,
      explanation: `I don't have a simple explanation saved for "${rawTerm}" yet, but I can connect you to a banking expert who can help.`,
    };
  }

  const grounded = entry.ground ? entry.ground(userId, primary ? primary.balance : 0, txns) : '';
  const explanation = grounded ? `${entry.plain} ${grounded}` : entry.plain;

  return {
    term: entry.term,
    known: true,
    plain: entry.plain,
    example: grounded,
    explanation,
  };
}

function normalise(t) {
  const s = String(t || '').toLowerCase().trim();
  if (ALIASES[s]) return ALIASES[s];
  return s.replace(/[^a-z]/g, '');
}

export function listKnownTerms() {
  return Object.values(KB).map((e) => e.term);
}

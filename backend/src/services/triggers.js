/**
 * triggers.js - Proactive Trigger Engine.
 *
 * Scans the user's live data (balances, upcoming mandates, recent spend) and
 * decides when Vaani should reach out. This is the piece that makes Vaani
 * proactive rather than reactive. Fully dynamic - every trigger is evaluated
 * against real data at request time.
 *
 * In production this logic runs against a Kafka stream of transaction events;
 * here it evaluates on demand over the same data shape.
 */

import { getPrimaryAccount, getMandates, getTransactions, getAccounts } from './store.js';

export function evaluateTriggers(userId) {
  const triggers = [];
  const primary = getPrimaryAccount(userId);
  const accounts = getAccounts(userId);
  const mandates = getMandates(userId);
  const now = Date.now();

  // 1. Low balance before an upcoming debit
  for (const m of mandates) {
    const debitTime = new Date(m.nextDebit).getTime();
    const daysUntil = Math.ceil((debitTime - now) / 86400000);
    if (daysUntil >= 0 && daysUntil <= 3) {
      const acc = accounts.find((a) => a.id === m.accountId) || primary;
      if (acc && acc.balance < m.amount) {
        triggers.push({
          type: 'low_balance_before_debit',
          severity: 'high',
          title: `Low balance before ${m.payee}`,
          message: `${m.payee} of Rs. ${m.amount.toLocaleString('en-IN')} is due in ${daysUntil === 0 ? 'less than a day' : daysUntil + ' day(s)'}, but your balance is only Rs. ${acc.balance.toLocaleString('en-IN')}. Shall I help arrange the shortfall?`,
          data: { payee: m.payee, amount: m.amount, balance: acc.balance, daysUntil, shortfall: Math.round(m.amount - acc.balance) },
          suggestedAction: 'arrange_funds',
        });
      } else if (acc) {
        triggers.push({
          type: 'upcoming_debit',
          severity: 'low',
          title: `${m.payee} due soon`,
          message: `Reminder: ${m.payee} of Rs. ${m.amount.toLocaleString('en-IN')} will be auto-debited in ${daysUntil === 0 ? 'less than a day' : daysUntil + ' day(s)'}. Your balance is sufficient.`,
          data: { payee: m.payee, amount: m.amount, daysUntil },
          suggestedAction: null,
        });
      }
    }
  }

  // 2. Unusual spend - a single debit much larger than the user's typical debit
  const recent = getTransactions(userId, { limit: 60, sinceDays: 45 }).filter((t) => t.type === 'debit');
  if (recent.length >= 5) {
    const amounts = recent.map((t) => Math.abs(t.amount));
    const mean = amounts.reduce((s, a) => s + a, 0) / amounts.length;
    const last = recent[0];
    if (Math.abs(last.amount) > mean * 3 && Math.abs(last.amount) > 3000) {
      const when = Math.ceil((now - new Date(last.date).getTime()) / 86400000);
      triggers.push({
        type: 'unusual_spend',
        severity: 'medium',
        title: 'Unusually large spend detected',
        message: `A spend of Rs. ${Math.abs(last.amount).toLocaleString('en-IN')} (${last.desc}) ${when <= 1 ? 'today' : when + ' days ago'} is much higher than your usual. If this was not you, I can help you dispute it.`,
        data: { transactionId: last.id, desc: last.desc, amount: last.amount },
        suggestedAction: 'review_dispute',
      });
    }
  }

  // 3. Maturity / goal nudges
  for (const acc of accounts) {
    if (acc.type === 'recurring_deposit' && acc.maturityDate) {
      const days = Math.ceil((new Date(acc.maturityDate).getTime() - now) / 86400000);
      if (days > 0 && days <= 30) {
        triggers.push({
          type: 'maturity_soon',
          severity: 'low',
          title: 'RD maturing soon',
          message: `Your recurring deposit ${acc.number} matures in ${days} days with about Rs. ${acc.balance.toLocaleString('en-IN')}. Want me to explain your reinvestment options?`,
          data: { account: acc.number, balance: acc.balance, days },
          suggestedAction: 'explain_options',
        });
      }
    }
  }

  return triggers.sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
}

function severityRank(s) {
  return s === 'high' ? 3 : s === 'medium' ? 2 : 1;
}

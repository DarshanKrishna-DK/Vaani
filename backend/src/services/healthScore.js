/**
 * healthScore.js - Financial Health Score engine.
 *
 * Fully dynamic: computes a 0-100 score from the user's actual transaction
 * history and balances. No mocked score values anywhere - every number is
 * derived at request time.
 *
 * Five sub-scores (each 0-100), weighted into an overall score:
 *   1. Cash-flow stability   (income vs expense over the window)
 *   2. Savings rate          (what fraction of income is retained)
 *   3. Debt-service ratio     (EMI + loan outgo vs income)
 *   4. Emergency-fund buffer   (balance vs monthly expense)
 *   5. Spending discipline    (discretionary spend share)
 */

import { getTransactions, getAccounts, getPrimaryAccount } from './store.js';

const DISCRETIONARY = new Set(['food', 'travel', 'maintenance', 'shopping', 'entertainment']);
const DEBT = new Set(['emi']);

function clamp(n, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}

export function computeHealthScore(userId, windowDays = 30) {
  const txns = getTransactions(userId, { limit: 500, sinceDays: windowDays });
  const accounts = getAccounts(userId);
  const primary = getPrimaryAccount(userId);

  const income = txns.filter((t) => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
  const expenseTxns = txns.filter((t) => t.type === 'debit');
  const expense = Math.abs(expenseTxns.reduce((s, t) => s + t.amount, 0));
  const debtOutgo = Math.abs(expenseTxns.filter((t) => DEBT.has(t.category)).reduce((s, t) => s + t.amount, 0));
  const discretionary = Math.abs(expenseTxns.filter((t) => DISCRETIONARY.has(t.category)).reduce((s, t) => s + t.amount, 0));
  const savingsOutgo = Math.abs(expenseTxns.filter((t) => t.category === 'savings').reduce((s, t) => s + t.amount, 0));

  const monthlyExpense = expense === 0 ? 1 : expense; // avoid div by zero
  const totalBalance = accounts.reduce((s, a) => s + Math.max(0, a.balance), 0);

  // 1. Cash-flow stability: income should cover expense with margin
  const cashFlowRatio = income === 0 ? 0 : (income - expense) / income;
  const cashFlow = clamp(50 + cashFlowRatio * 120);

  // 2. Savings rate: (retained + explicit savings) / income
  const retained = income - expense + savingsOutgo;
  const savingsRate = income === 0 ? 0 : (retained + savingsOutgo) / income;
  const savings = clamp(savingsRate * 220);

  // 3. Debt-service ratio: lower is better (target < 40% of income)
  const dsr = income === 0 ? 1 : debtOutgo / income;
  const debtService = clamp(100 - dsr * 180);

  // 4. Emergency-fund buffer: balance / monthly expense (target 3-6 months)
  const monthsBuffer = totalBalance / monthlyExpense;
  const emergency = clamp((monthsBuffer / 3) * 100);

  // 5. Spending discipline: discretionary share of expense (lower is better)
  const discShare = expense === 0 ? 0 : discretionary / expense;
  const discipline = clamp(100 - discShare * 160);

  const weights = { cashFlow: 0.28, savings: 0.24, debtService: 0.2, emergency: 0.16, discipline: 0.12 };
  const overall = Math.round(
    cashFlow * weights.cashFlow +
      savings * weights.savings +
      debtService * weights.debtService +
      emergency * weights.emergency +
      discipline * weights.discipline
  );

  const grade = overall >= 80 ? 'A' : overall >= 65 ? 'B' : overall >= 50 ? 'C' : overall >= 35 ? 'D' : 'E';

  // Human-readable insights derived from the weakest dimensions
  const dims = [
    { key: 'cashFlow', label: 'Cash-flow stability', value: Math.round(cashFlow) },
    { key: 'savings', label: 'Savings rate', value: Math.round(savings) },
    { key: 'debtService', label: 'Debt-service ratio', value: Math.round(debtService) },
    { key: 'emergency', label: 'Emergency-fund buffer', value: Math.round(emergency) },
    { key: 'discipline', label: 'Spending discipline', value: Math.round(discipline) },
  ];
  const weakest = [...dims].sort((a, b) => a.value - b.value).slice(0, 2);

  const insights = weakest.map((d) => {
    switch (d.key) {
      case 'cashFlow':
        return 'Your spending is close to your income this month - try to keep a wider gap between what comes in and what goes out.';
      case 'savings':
        return `You are saving about ${Math.round(savingsRate * 100)}% of your income. Even a small automatic RD can lift this.`;
      case 'debtService':
        return `EMIs take about ${Math.round(dsr * 100)}% of your income. Keeping this under 40% leaves more room for emergencies.`;
      case 'emergency':
        return `Your balance covers about ${monthsBuffer.toFixed(1)} months of expenses. Aiming for 3 months builds a safety net.`;
      case 'discipline':
        return `Discretionary spends (food, travel, repairs) are about ${Math.round(discShare * 100)}% of your outgo.`;
      default:
        return '';
    }
  });

  return {
    overall,
    grade,
    windowDays,
    dimensions: dims,
    metrics: {
      income: Math.round(income),
      expense: Math.round(expense),
      net: Math.round(income - expense),
      debtOutgo: Math.round(debtOutgo),
      discretionary: Math.round(discretionary),
      monthsBuffer: Math.round(monthsBuffer * 10) / 10,
      savingsRatePct: Math.round(savingsRate * 100),
    },
    insights,
    computedAt: new Date().toISOString(),
  };
}

/** Spend-by-category breakdown for charts - dynamic. */
export function computeSpendBreakdown(userId, windowDays = 30) {
  const txns = getTransactions(userId, { limit: 500, sinceDays: windowDays }).filter((t) => t.type === 'debit');
  const byCat = {};
  for (const t of txns) {
    byCat[t.category] = (byCat[t.category] || 0) + Math.abs(t.amount);
  }
  return Object.entries(byCat)
    .map(([category, amount]) => ({ category, amount: Math.round(amount) }))
    .sort((a, b) => b.amount - a.amount);
}

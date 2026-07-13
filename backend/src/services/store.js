/**
 * store.js - The data layer for Vaani.
 *
 * This is a repository over an in-memory copy of the seed data. It is the ONLY
 * place mock data lives. The interface (getUser, getAccounts, addTransaction,
 * etc.) is intentionally shaped like a Supabase/Postgres data-access layer so
 * that swapping to a real database is a drop-in change:
 *
 *   - If SUPABASE_URL + SUPABASE_KEY are set, this module can be re-pointed at
 *     the Supabase client (see the commented block at the bottom).
 *   - Without them, it runs fully in-memory so the MVP works with zero setup.
 *
 * All mutations here are real: transfers move money, disputes create cases,
 * the audit log grows. Nothing about the *behaviour* is mocked - only the
 * seed rows the behaviour operates on.
 */

import { SEED } from '../data/seed.js';

// Deep clone the seed so restarts give a clean, deterministic demo state.
let db = structuredClone(SEED);

export function resetStore() {
  db = structuredClone(SEED);
}

// ---------- Users ----------
export function getUser(userId) {
  return db.users.find((u) => u.id === userId) || null;
}
export function listUsers() {
  return db.users.map((u) => ({ id: u.id, name: u.name, occupation: u.occupation, city: u.city, preferredLanguage: u.preferredLanguage }));
}
export function updateUser(userId, patch) {
  const u = getUser(userId);
  if (!u) return null;
  Object.assign(u, patch);
  return u;
}

// ---------- Accounts ----------
export function getAccounts(userId) {
  return db.accounts.filter((a) => a.userId === userId);
}
export function getAccount(accountId) {
  return db.accounts.find((a) => a.id === accountId) || null;
}
export function getPrimaryAccount(userId) {
  return db.accounts.find((a) => a.userId === userId && a.type === 'savings') || getAccounts(userId)[0] || null;
}

// ---------- Transactions ----------
export function getTransactions(userId, { limit = 100, category = null, sinceDays = null } = {}) {
  let txns = db.transactions.filter((t) => t.userId === userId);
  if (category) txns = txns.filter((t) => t.category === category);
  if (sinceDays != null) {
    const cutoff = Date.now() - sinceDays * 86400000;
    txns = txns.filter((t) => new Date(t.date).getTime() >= cutoff);
  }
  txns.sort((a, b) => new Date(b.date) - new Date(a.date));
  return txns.slice(0, limit);
}

export function addTransaction(txn) {
  const record = {
    id: 't_' + Math.random().toString(36).slice(2, 10),
    date: new Date().toISOString(),
    ...txn,
  };
  db.transactions.push(record);
  // Apply to account balance (real mutation)
  const acc = getAccount(txn.accountId);
  if (acc) acc.balance = Math.round((acc.balance + txn.amount) * 100) / 100;
  return record;
}

// ---------- Payees ----------
export function getPayees(userId) {
  return db.payees.filter((p) => p.userId === userId);
}
export function findPayee(userId, query) {
  const q = query.toLowerCase();
  return (
    db.payees.find((p) => p.userId === userId && p.name.toLowerCase().includes(q)) ||
    db.payees.find((p) => p.userId === userId && (p.upiId || '').toLowerCase().includes(q)) ||
    null
  );
}

// ---------- Mandates (scheduled debits) ----------
export function getMandates(userId) {
  return db.mandates.filter((m) => m.userId === userId).sort((a, b) => new Date(a.nextDebit) - new Date(b.nextDebit));
}

// ---------- Life context (memory) ----------
export function getLifeContext(userId) {
  const u = getUser(userId);
  return u ? u.lifeContext : [];
}
export function addLifeContext(userId, item) {
  const u = getUser(userId);
  if (!u) return null;
  const record = { key: 'ctx_' + Math.random().toString(36).slice(2, 8), ...item };
  u.lifeContext.push(record);
  return record;
}

// ---------- Disputes ----------
export function getDisputes(userId) {
  return db.disputes.filter((d) => d.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
export function createDispute({ userId, transactionId, reason }) {
  const txn = db.transactions.find((t) => t.id === transactionId && t.userId === userId);
  const caseId = 'DSP' + Date.now().toString().slice(-8);
  const record = {
    id: caseId,
    userId,
    transactionId,
    txnDesc: txn ? txn.desc : 'Unknown transaction',
    amount: txn ? txn.amount : null,
    reason,
    status: 'filed',
    createdAt: new Date().toISOString(),
    expectedResolution: new Date(Date.now() + 7 * 86400000).toISOString(),
  };
  db.disputes.push(record);
  return record;
}

// ---------- Audit log (append-only) ----------
export function appendAudit(entry) {
  const record = { id: 'a_' + Math.random().toString(36).slice(2, 10), at: new Date().toISOString(), ...entry };
  db.auditLog.push(record);
  return record;
}
export function getAudit(userId, { limit = 50 } = {}) {
  return db.auditLog
    .filter((a) => a.userId === userId)
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, limit);
}

/*
 * ----- Supabase drop-in (production) -----
 * Uncomment and set SUPABASE_URL / SUPABASE_KEY in .env to use a real DB.
 * The schema mirrors the seed shape exactly (users, accounts, transactions,
 * payees, mandates, disputes, audit_log). See docs/SUPABASE_SCHEMA.sql.
 *
 * import { createClient } from '@supabase/supabase-js';
 * const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
 * // then re-implement each function above as an awaited supabase query.
 */

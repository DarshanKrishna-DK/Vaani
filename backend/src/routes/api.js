/**
 * api.js - Vaani REST API routes.
 * Every endpoint reads/writes live data via the store and engines.
 */
import { Router } from 'express';
import { runTurn } from '../agent/runtime.js';
import {
  listUsers,
  getUser,
  getAccounts,
  getPrimaryAccount,
  getTransactions,
  getPayees,
  getMandates,
  getLifeContext,
  getDisputes,
  getAudit,
  updateUser,
  resetStore,
} from '../services/store.js';
import { computeHealthScore, computeSpendBreakdown } from '../services/healthScore.js';
import { evaluateTriggers } from '../services/triggers.js';
import { hasGroq } from '../services/groq.js';
import { listKnownTerms } from '../services/explain.js';

const router = Router();

// Health / status
router.get('/status', (req, res) => {
  res.json({ ok: true, aiMode: hasGroq() ? 'groq' : 'fallback', time: new Date().toISOString() });
});

// Users
router.get('/users', (req, res) => res.json({ users: listUsers() }));
router.get('/users/:id', (req, res) => {
  const u = getUser(req.params.id);
  if (!u) return res.status(404).json({ error: 'not found' });
  res.json({ user: u });
});
router.patch('/users/:id', (req, res) => {
  const u = updateUser(req.params.id, req.body || {});
  if (!u) return res.status(404).json({ error: 'not found' });
  res.json({ user: u });
});

// Accounts + overview
router.get('/users/:id/overview', (req, res) => {
  const userId = req.params.id;
  const u = getUser(userId);
  if (!u) return res.status(404).json({ error: 'not found' });
  res.json({
    user: u,
    accounts: getAccounts(userId),
    primary: getPrimaryAccount(userId),
    recentTransactions: getTransactions(userId, { limit: 6 }),
    upcomingDues: getMandates(userId).slice(0, 4),
    healthScore: computeHealthScore(userId),
    spendBreakdown: computeSpendBreakdown(userId),
    triggers: evaluateTriggers(userId),
    lifeContext: getLifeContext(userId),
  });
});

router.get('/users/:id/transactions', (req, res) => {
  const { limit, category, sinceDays } = req.query;
  res.json({
    transactions: getTransactions(req.params.id, {
      limit: limit ? parseInt(limit, 10) : 50,
      category: category || null,
      sinceDays: sinceDays ? parseInt(sinceDays, 10) : null,
    }),
  });
});

router.get('/users/:id/health', (req, res) => res.json(computeHealthScore(req.params.id)));
router.get('/users/:id/spend', (req, res) => res.json({ breakdown: computeSpendBreakdown(req.params.id) }));
router.get('/users/:id/triggers', (req, res) => res.json({ triggers: evaluateTriggers(req.params.id) }));
router.get('/users/:id/dues', (req, res) => res.json({ dues: getMandates(req.params.id) }));
router.get('/users/:id/payees', (req, res) => res.json({ payees: getPayees(req.params.id) }));
router.get('/users/:id/disputes', (req, res) => res.json({ disputes: getDisputes(req.params.id) }));
router.get('/users/:id/context', (req, res) => res.json({ lifeContext: getLifeContext(req.params.id) }));
router.get('/users/:id/audit', (req, res) => res.json({ audit: getAudit(req.params.id) }));

// Terms KB
router.get('/terms', (req, res) => res.json({ terms: listKnownTerms() }));

// Execute a confirmation-gated action directly (button-driven from the UI).
// This bypasses NL parsing so the "Confirm" button always does exactly the
// action that was surfaced to the user.
router.post('/agent/confirm', (req, res) => {
  const { userId, action, args } = req.body || {};
  if (!userId || !action) return res.status(400).json({ error: 'userId and action are required' });
  import('../tools/tools.js').then(({ TOOLS }) => {
    const impl = TOOLS[action];
    if (!impl) return res.status(400).json({ error: 'unknown action' });
    const result = impl(userId, { ...(args || {}), confirmed: true });
    res.json({ reply: result.summary, data: result.data, ok: result.ok, toolCalls: [{ name: action, args, result: { ok: result.ok, summary: result.summary } }] });
  });
});

// The agent turn - the core endpoint
router.post('/agent/turn', async (req, res) => {
  const { userId, text, language, history } = req.body || {};
  if (!userId || !text) return res.status(400).json({ error: 'userId and text are required' });
  try {
    const result = await runTurn({ userId, text, language, history });
    res.json(result);
  } catch (err) {
    console.error('agent turn error:', err.message);
    res.status(500).json({ error: 'agent error', detail: err.message });
  }
});

// Demo reset
router.post('/reset', (req, res) => {
  resetStore();
  res.json({ ok: true });
});

export default router;

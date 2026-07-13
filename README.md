# Vaani - Hands-free banking for India's next billion (Under Development)

An MVP of **Vaani**, a hands-free, agentic banking companion built for the
**IDBI Innovate 2026** hackathon (Conversational Assistance track).

Vaani lets a customer complete banking tasks by talking - check balance, send
money, understand jargon, review upcoming dues, see a financial health score,
and file disputes - in the language they actually speak, without touching a
screen or navigating an app.

This MVP implements the six-layer agent from the build plan on **free tools
only**:

| Layer | This MVP | Production swap-in |
| --- | --- | --- |
| Voice I/O | Browser Web Speech API (STT + TTS) | Sarvam AI / Bhashini |
| Orchestration | **Groq** (Llama 3.3) tool-use loop, with a deterministic fallback planner | same, plus fine-tuned intent model |
| Memory & Context | In-memory store seeded with demo data | **Supabase** (Postgres) |
| Tools & Skills | 9 real tools (balance, transfer, dues, health, spend, explain, dispute, remember, statement) | same, wired to core banking |
| Integration | Repository shaped for swap-in | IDBI Sandbox / NPCI UPI / CIBIL |
| Trust & Compliance | Confirmation-gated actions, append-only audit log | + voice biometric, OTP step-up |

## What is real vs mocked

**The only mocked thing is the demo customers' seed data**
(`backend/src/data/seed.js`). Everything else is fully dynamic:

- The agent reasons over the utterance and selects tools.
- Transfers actually move balance; disputes create real case IDs.
- The Financial Health Score is computed from the transaction history.
- Proactive triggers are evaluated from live balances and upcoming mandates.
- Jargon explanations are grounded in the user's own numbers.
- Every action is written to an append-only audit log.

Swap the seed for real IDBI data behind the same repository interface and no
other code changes are needed.

---

## Project layout

```
vaani/
├── backend/                 Node + Express API, agent runtime, engines
│   ├── src/
│   │   ├── data/seed.js      the ONLY mocked data (2 demo customers)
│   │   ├── services/         store, healthScore, triggers, explain, groq
│   │   ├── tools/tools.js    the 9 real banking tools
│   │   ├── agent/            runtime (LLM + fallback planner)
│   │   ├── routes/api.js     REST API
│   │   └── server.js         entry point
│   └── .env.template
├── frontend/                Vite + React + TypeScript + Tailwind v4
│   └── src/
│       ├── pages/           Home, Talk, Dashboard, How
│       ├── components/      Navbar, VoiceOrb, Switchers, Footer, Logo
│       ├── hooks/useSpeech  Web Speech API (voice in/out)
│       ├── lib/api.ts       typed API client
│       └── styles/App.css   Vaani design system
└── docs/
    └── SUPABASE_SCHEMA.sql  production DB schema
```

---

## Running it (two terminals)

### 1. Backend

```bash
cd backend
npm install
cp .env.template .env      # optional: add GROQ_API_KEY for live LLM
npm start                  # runs on http://localhost:5050
```

The backend runs **with zero configuration**. Without a `GROQ_API_KEY` it uses
a deterministic fallback planner - all tools, data, scoring and actions still
work; only the natural-language phrasing is simpler.

To enable the live LLM agent, get a free key at
<https://console.groq.com/keys> and set `GROQ_API_KEY` in `backend/.env`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                # runs on http://localhost:5173
```

The dev server proxies `/api` to the backend automatically. Open
<http://localhost:5173>.

> **Voice:** the hands-free voice input uses the browser's built-in Web Speech
> API. It works best in Chrome or Edge. In other browsers, typing works fully
> and Vaani still replies in text (and speaks where TTS is available).

---

## Using the app

- **Home** - the landing page and product thesis.
- **Talk to Vaani** - the core hands-free experience. Tap the orb and speak, or
  type. Try: *"Kitne paise bache hain?"*, *"SIP kya hota hai?"*,
  *"Suresh ko 500 rupaye bhejo"*, *"Konse bills due hain?"*
- **Dashboard** - the visual companion: proactive nudges, balance, health
  score, spend breakdown, upcoming dues, recent transactions, and what Vaani
  remembers.
- **How it works** - the architecture and the real-vs-mocked breakdown.

Use the **language switcher** (Hinglish / Hindi / English / Tamil / Marathi)
and the **user switcher** (two demo customers: Ramesh, a truck driver; Lakshmi,
a kirana store owner) in the top-right of the Talk and Dashboard pages.

Money actions (transfer, dispute) always ask for confirmation before running.

---

## Using Supabase (optional, production)

1. Create a free project at <https://supabase.com>.
2. Run `docs/SUPABASE_SCHEMA.sql` in the Supabase SQL editor.
3. Set `SUPABASE_URL` and `SUPABASE_KEY` in `backend/.env`.
4. Re-point `backend/src/services/store.js` at the Supabase client (a commented
   drop-in block is provided at the bottom of that file).

---

## Tech

- **Frontend:** React 18, TypeScript, Vite 5, Tailwind CSS v4, framer-motion,
  lucide-react, react-router-dom. Design adapted from the SwyftPay frontend.
- **Backend:** Node 20+, Express, ESM. Groq for AI (free tier). Web Speech API
  for voice (free, browser-native). In-memory store (Supabase-ready).

Built for IDBI Innovate 2026 · Team Vaani.

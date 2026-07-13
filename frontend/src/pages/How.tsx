import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Mic, ArrowRight, Layers, Cpu, Database, Wrench, Plug, ShieldCheck } from "lucide-react";

const LAYERS = [
  { icon: Mic, name: "Voice I/O", tech: "Browser Web Speech API (STT + TTS) in this MVP; Sarvam AI / Bhashini in production", color: "text-saffron" },
  { icon: Cpu, name: "Orchestration", tech: "Groq (Llama 3.3) LLM planner with tool-use loop; deterministic fallback planner when no key is set", color: "text-magenta" },
  { icon: Database, name: "Memory & Context", tech: "In-memory store seeded with demo data; drop-in Supabase (Postgres) for production", color: "text-indigo" },
  { icon: Wrench, name: "Tools & Skills", tech: "9 real tools: balance, statement, transfer, dues, health score, spend, explain, dispute, remember", color: "text-saffron" },
  { icon: Plug, name: "Integration", tech: "Store repository shaped for IDBI Sandbox / NPCI UPI / CIBIL swap-in", color: "text-magenta" },
  { icon: ShieldCheck, name: "Trust & Compliance", tech: "Confirmation-gated money actions, append-only audit log, no numbers invented by the model", color: "text-indigo" },
];

const DEMO_LINES = [
  { role: "user", text: "Suresh ko 500 rupaye bhejo" },
  { role: "vaani", text: "Please confirm: send ₹500 to Suresh (brother)?" },
  { role: "user", text: "[taps Confirm]" },
  { role: "vaani", text: "Done. ₹500 sent to Suresh. Your new balance is ₹11,950." },
];

export function How() {
  return (
    <div className="mx-auto max-w-4xl px-6 pt-28 pb-20">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl md:text-4xl font-bold mb-3">How Vaani works</h1>
        <p className="text-text-muted max-w-2xl leading-relaxed">
          Vaani is built as a six-layer agent. This MVP runs the whole stack on free tools - Groq for AI, the browser's own speech engine for voice, and an in-memory store that mirrors a Supabase schema. Everything except the demo customer's data is real and dynamic.
        </p>
      </motion.div>

      {/* Layer stack */}
      <div className="mt-10 space-y-3">
        {LAYERS.map((l, i) => {
          const Icon = l.icon;
          return (
            <motion.div
              key={l.name}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="card p-4 flex items-center gap-4"
            >
              <div className={`grid place-items-center w-11 h-11 rounded-lg bg-bg-elev ${l.color} shrink-0`}>
                <Icon size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Layers size={13} className="text-text-dim" />
                  <h3 className="text-sm font-semibold">Layer {i + 1} · {l.name}</h3>
                </div>
                <p className="text-xs text-text-muted mt-0.5">{l.tech}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Sample conversation */}
      <div className="mt-12">
        <h2 className="text-xl font-bold mb-4">A money transfer, hands-free</h2>
        <div className="card p-5 space-y-3">
          {DEMO_LINES.map((l, i) => (
            <div key={i} className={`flex ${l.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm font-hindi ${l.role === "user" ? "bubble-user rounded-br-sm" : "bubble-vaani rounded-bl-sm"}`}>
                {l.text}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-text-dim">Every state-changing action asks for confirmation before it runs. Vaani never moves money on its own.</p>
      </div>

      {/* What's real vs mocked */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-ok mb-3">Fully dynamic (real)</h3>
          <ul className="space-y-1.5 text-xs text-text-muted">
            <li>· Agent reasoning &amp; tool selection</li>
            <li>· Transfers that actually move balance</li>
            <li>· Financial health score computed from transactions</li>
            <li>· Proactive triggers evaluated from live data</li>
            <li>· Jargon explanations grounded in your numbers</li>
            <li>· Dispute filing with generated case IDs</li>
            <li>· Audit log of every action</li>
          </ul>
        </div>
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-warn mb-3">Mocked (the only thing)</h3>
          <ul className="space-y-1.5 text-xs text-text-muted">
            <li>· The two demo customers' seed records</li>
            <li className="text-text-dim pt-2">Everything operates on top of this seed. In production it is replaced by real IDBI Core Banking / UPI data behind the same interface - no other code changes.</li>
          </ul>
        </div>
      </div>

      <div className="mt-10">
        <Link to="/talk" className="inline-flex items-center gap-2 rounded-lg gradient-bg px-6 py-3 text-sm font-semibold text-bg hover:opacity-90 transition-opacity">
          <Mic size={16} /> Talk to Vaani <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Mic,
  ArrowRight,
  Hand,
  Zap,
  Bell,
  BookOpen,
  ShieldCheck,
  Brain,
  Languages,
  Activity,
} from "lucide-react";
import { VoiceOrb } from "../components/VoiceOrb";

const FEATURES = [
  { icon: Hand, title: "Hands-free", body: "No taps, no screens, no forms. Voice is the whole interface - drive, cook, farm, or run a shop while you bank." },
  { icon: Zap, title: "Agentic", body: "Completes multi-step tasks in one turn. Not a Q&A bot - it plans, decides, and acts." },
  { icon: Bell, title: "Proactive", body: "Reaches out when it matters: low balance before an EMI, unusual spend, a bill about to hit." },
  { icon: BookOpen, title: "Explains, then acts", body: "Every jargon term demystified using your own transactions - before it recommends anything." },
  { icon: Languages, title: "Your language", body: "Hindi, Hinglish, Tamil, Marathi, English - with natural code-switching, not menu-tree translations." },
  { icon: Brain, title: "Remembers you", body: "Knows about your daughter's fees, your father's medicines, your savings goal - and plans around them." },
  { icon: Activity, title: "Health score", body: "Computes your financial health quietly and explains how to improve it in plain words." },
  { icon: ShieldCheck, title: "Safe by design", body: "Voice biometric for small actions, OTP step-up for big ones. Every action is confirmed and logged." },
];

const STEPS = [
  { n: "01", title: "You speak", body: "In the language you actually use, however you phrase it." },
  { n: "02", title: "Vaani understands", body: "Detects intent and pulls your real account data - never guesses numbers." },
  { n: "03", title: "It acts, then confirms", body: "Completes the task and reads back what happened. Money actions always ask first." },
];

export function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-24 overflow-hidden">
        <div className="absolute top-10 left-1/4 w-[520px] h-[520px] rounded-full bg-magenta/[0.06] blur-[150px] pointer-events-none" />
        <div className="absolute top-32 right-1/4 w-[440px] h-[440px] rounded-full bg-indigo/[0.06] blur-[150px] pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-card px-3 py-1 text-xs text-text-muted mb-6">
                <span className="w-1.5 h-1.5 rounded-full gradient-bg" />
                IDBI Innovate 2026 · Conversational Assistance
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-[3.4rem] font-extrabold leading-[1.08] tracking-tight">
                Hands-free banking
                <br />
                for India's <span className="gradient-text">next billion</span>
              </h1>
              <p className="mt-6 text-base md:text-lg text-text-muted leading-relaxed max-w-lg">
                Vaani is a banking agent you never have to touch. Talk to it in your own language - check balance, send money, understand jargon, file a dispute - all without a screen, a form, or an app to learn.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link to="/talk" className="group flex items-center gap-2 rounded-lg gradient-bg px-6 py-3 text-sm font-semibold text-bg hover:opacity-90 transition-opacity">
                  <Mic size={16} />
                  Talk to Vaani
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/dashboard" className="rounded-lg border border-border px-6 py-3 text-sm font-medium text-text-muted hover:text-text hover:border-border-hover transition-all">
                  See the dashboard
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-5 text-xs text-text-muted font-mono">
                <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-saffron" /> Voice-native</span>
                <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-magenta" /> Agentic</span>
                <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo" /> Multilingual</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="flex flex-col items-center justify-center gap-6"
            >
              <VoiceOrb state="idle" size={260} />
              <div className="text-center">
                <p className="text-sm text-text-muted font-hindi">"Vaani, kitne paise bache hain?"</p>
                <p className="mt-1 text-xs text-text-dim">Ask anything, in any language</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 border-t border-border/50">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Not another chatbot with a mic button</h2>
          <p className="text-text-muted mb-10 max-w-2xl">Existing bank bots make you type, tap, and navigate app UI. Vaani needs neither your hands nor your eyes.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (i % 4) * 0.05, duration: 0.4 }}
                  className="card card-glow p-5"
                >
                  <div className="grid place-items-center w-10 h-10 rounded-lg bg-magenta/10 text-magenta mb-3">
                    <Icon size={19} />
                  </div>
                  <h3 className="text-sm font-semibold mb-1.5">{f.title}</h3>
                  <p className="text-xs text-text-muted leading-relaxed">{f.body}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works strip */}
      <section className="py-16 border-t border-border/50">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-2xl md:text-3xl font-bold mb-10">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STEPS.map((s) => (
              <div key={s.n} className="card p-6">
                <div className="text-3xl font-bold gradient-text font-mono mb-3">{s.n}</div>
                <h3 className="text-base font-semibold mb-1.5">{s.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Link to="/talk" className="inline-flex items-center gap-2 rounded-lg gradient-bg px-6 py-3 text-sm font-semibold text-bg hover:opacity-90 transition-opacity">
              <Mic size={16} /> Try it now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

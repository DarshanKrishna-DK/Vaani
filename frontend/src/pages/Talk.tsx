import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Volume2, VolumeX, Check, X, Info, Sparkles } from "lucide-react";
import { VoiceOrb, orbLabel, type OrbState } from "../components/VoiceOrb";
import { LanguageSwitcher, UserSwitcher } from "../components/Switchers";
import { useSession } from "../config/session";
import { useSpeech } from "../hooks/useSpeech";
import { api, inr, type AgentResult } from "../lib/api";

interface Msg {
  id: string;
  role: "user" | "vaani";
  text: string;
  result?: AgentResult;
}

const SUGGESTIONS: Record<string, { label: string; text: string }[]> = {
  hinglish: [
    { label: "Balance", text: "Kitne paise bache hain?" },
    { label: "SIP kya hai?", text: "SIP kya hota hai?" },
    { label: "Send money", text: "Suresh ko 500 rupaye bhejo" },
    { label: "Bills due", text: "Konse bills due hain?" },
    { label: "Money check", text: "Meri financial health kaisi hai?" },
  ],
  en: [
    { label: "Balance", text: "How much money do I have?" },
    { label: "What is SIP?", text: "What is SIP?" },
    { label: "Send money", text: "Send 500 rupees to Suresh" },
    { label: "Bills due", text: "What bills are due soon?" },
    { label: "Money check", text: "How is my financial health?" },
  ],
  hi: [
    { label: "बैलेंस", text: "मेरे कितने पैसे बचे हैं?" },
    { label: "SIP क्या है?", text: "SIP क्या होता है?" },
    { label: "पैसे भेजो", text: "सुरेश को 500 रुपये भेजो" },
    { label: "बिल", text: "कौन से बिल बाकी हैं?" },
    { label: "हेल्थ", text: "मेरी फाइनेंशियल हेल्थ कैसी है?" },
  ],
  ta: [
    { label: "Balance", text: "How much money do I have?" },
    { label: "What is SIP?", text: "What is SIP?" },
    { label: "Send money", text: "Send 500 to Suresh" },
    { label: "Bills", text: "What bills are due?" },
    { label: "Health", text: "How is my financial health?" },
  ],
  mr: [
    { label: "Balance", text: "How much money do I have?" },
    { label: "What is SIP?", text: "What is SIP?" },
    { label: "Send money", text: "Send 500 to Suresh" },
    { label: "Bills", text: "What bills are due?" },
    { label: "Health", text: "How is my financial health?" },
  ],
};

export function Talk() {
  const { userId, language } = useSession();
  const { supported, listening, interim, listen, stop, speak, cancelSpeech } = useSpeech(language);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [orb, setOrb] = useState<OrbState>("idle");
  const [input, setInput] = useState("");
  const [ttsOn, setTtsOn] = useState(true);
  const [pending, setPending] = useState<{ action: string; args: any; label: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const history = useRef<{ role: string; content: string }[]>([]);

  // Reset conversation when user changes
  useEffect(() => {
    setMessages([]);
    history.current = [];
    setPending(null);
  }, [userId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, orb]);

  const handleResult = useCallback(
    (result: AgentResult) => {
      const vaaniMsg: Msg = { id: "v" + Date.now(), role: "vaani", text: result.reply, result };
      setMessages((m) => [...m, vaaniMsg]);
      history.current.push({ role: "assistant", content: result.reply });

      // Surface a confirmation card if the agent gated an action
      if (result.needsConfirmation && result.action && result.data) {
        const label =
          result.action === "transfer_money"
            ? `Send ${inr(result.data.amount)} to ${result.data.payee?.name}`
            : result.action === "file_dispute"
            ? `File dispute for ${result.data.transaction?.desc}`
            : "Confirm action";
        setPending({
          action: result.action,
          args:
            result.action === "transfer_money"
              ? { payee: result.data.payee?.name, amount: result.data.amount }
              : { transactionId: result.data.transaction?.id, reason: result.data.reason },
          label,
        });
      }

      if (ttsOn && result.reply) {
        setOrb("speaking");
        speak(result.reply, () => setOrb("idle"));
      } else {
        setOrb("idle");
      }
    },
    [ttsOn, speak]
  );

  const send = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      cancelSpeech();
      const userMsg: Msg = { id: "u" + Date.now(), role: "user", text };
      setMessages((m) => [...m, userMsg]);
      history.current.push({ role: "user", content: text });
      setInput("");
      setOrb("thinking");
      try {
        const result = await api.turn({ userId, text, language, history: history.current.slice(-6) });
        handleResult(result);
      } catch (e) {
        setMessages((m) => [...m, { id: "e" + Date.now(), role: "vaani", text: "Sorry, I could not reach the service. Please try again." }]);
        setOrb("idle");
      }
    },
    [userId, language, handleResult, cancelSpeech]
  );

  const confirmPending = useCallback(async () => {
    if (!pending) return;
    setOrb("thinking");
    const p = pending;
    setPending(null);
    try {
      const result = await api.confirm({ userId, action: p.action, args: p.args });
      handleResult(result);
    } catch {
      setOrb("idle");
    }
  }, [pending, userId, handleResult]);

  const onOrbClick = useCallback(() => {
    if (orb === "speaking") {
      cancelSpeech();
      setOrb("idle");
      return;
    }
    if (listening) {
      stop();
      setOrb("idle");
      return;
    }
    if (supported.stt) {
      setOrb("listening");
      listen((text) => send(text));
    }
  }, [orb, listening, supported.stt, listen, send, stop, cancelSpeech]);

  useEffect(() => {
    if (listening) setOrb("listening");
  }, [listening]);

  const suggestions = SUGGESTIONS[language] || SUGGESTIONS.en;

  return (
    <div className="mx-auto max-w-3xl px-4 pt-24 pb-32 min-h-screen flex flex-col">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold">Talk to Vaani</h1>
          <p className="text-xs text-text-muted">Hands-free. Speak or type in your language.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setTtsOn((v) => !v);
              if (ttsOn) cancelSpeech();
            }}
            className="rounded-lg border border-border bg-bg-card p-2.5 text-text-muted hover:text-text transition-colors"
            title={ttsOn ? "Voice replies on" : "Voice replies off"}
          >
            {ttsOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <LanguageSwitcher />
          <UserSwitcher />
        </div>
      </div>

      {/* Conversation area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto rounded-2xl border border-border bg-bg-card/40 p-4 space-y-4 min-h-[340px]">
        {messages.length === 0 && (
          <div className="h-full grid place-items-center text-center py-10">
            <div>
              <div className="flex justify-center mb-5">
                <VoiceOrb state={orb} size={150} onClick={onOrbClick} />
              </div>
              <p className="text-sm text-text-muted">{orbLabel(orb)}</p>
              <p className="mt-3 text-xs text-text-dim max-w-xs mx-auto">
                Ask about your balance, send money, understand a banking term, or check what's due - all by voice.
              </p>
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "bubble-user rounded-br-sm" : "bubble-vaani rounded-bl-sm"}`}>
                <p className="font-hindi">{m.text}</p>
                {m.result?.data && <ResultCard result={m.result} />}
                {m.result?.toolCalls && m.result.toolCalls.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {m.result.toolCalls.map((t, i) => (
                      <span key={i} className="inline-flex items-center gap-1 rounded-md bg-black/20 px-1.5 py-0.5 text-[10px] font-mono text-text-muted">
                        <Sparkles size={9} /> {t.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {orb === "thinking" && (
          <div className="flex justify-start">
            <div className="bubble-vaani rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}

        {listening && interim && (
          <div className="flex justify-end">
            <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-magenta/20 border border-magenta/30 px-4 py-2.5 text-sm text-text-muted italic font-hindi">
              {interim}…
            </div>
          </div>
        )}
      </div>

      {/* Confirmation card */}
      <AnimatePresence>
        {pending && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="mt-3 rounded-xl border border-magenta/40 bg-magenta/[0.06] p-4"
          >
            <div className="flex items-start gap-3">
              <div className="grid place-items-center w-9 h-9 rounded-lg gradient-bg text-bg shrink-0">
                <Info size={17} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-text">Confirm this action</p>
                <p className="text-sm text-text-muted mt-0.5">{pending.label}</p>
                <div className="mt-3 flex gap-2">
                  <button onClick={confirmPending} className="flex items-center gap-1.5 rounded-lg gradient-bg px-4 py-2 text-sm font-semibold text-bg hover:opacity-90">
                    <Check size={15} /> Confirm
                  </button>
                  <button onClick={() => setPending(null)} className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm text-text-muted hover:text-text">
                    <X size={15} /> Cancel
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input + orb control */}
      <div className="mt-3 flex items-center gap-3">
        <VoiceOrb state={orb} size={64} onClick={onOrbClick} />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex-1 flex items-center gap-2 rounded-xl border border-border bg-bg-card px-3 py-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={supported.stt ? "Tap the orb to speak, or type…" : "Type your message…"}
            className="flex-1 bg-transparent text-sm text-text placeholder:text-text-dim outline-none font-hindi"
          />
          <button type="submit" disabled={!input.trim()} className="rounded-lg gradient-bg p-2 text-bg disabled:opacity-40">
            <Send size={16} />
          </button>
        </form>
      </div>

      {/* Suggestion chips */}
      <div className="mt-3 flex flex-wrap gap-2">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => send(s.text)}
            className="rounded-full border border-border bg-bg-card px-3 py-1.5 text-xs text-text-muted hover:text-text hover:border-border-hover transition-colors font-hindi"
          >
            {s.label}
          </button>
        ))}
      </div>

      {!supported.stt && (
        <p className="mt-3 text-center text-[11px] text-text-dim">
          Voice input isn't supported in this browser - typing works fully. For the hands-free experience, try Chrome or Edge.
        </p>
      )}
    </div>
  );
}

// Renders structured data returned by tools (balance, statement, health, etc.)
function ResultCard({ result }: { result: AgentResult }) {
  const d = result.data;
  if (!d) return null;
  const tool = result.toolCalls?.[0]?.name;

  if (tool === "get_balance" && d.lines) {
    return (
      <div className="mt-2.5 space-y-1.5">
        {d.lines.map((line: string, i: number) => (
          <div key={i} className="rounded-lg bg-black/20 px-3 py-2 text-xs font-mono text-text">
            {line}
          </div>
        ))}
      </div>
    );
  }

  if (tool === "get_mini_statement" && d.transactions) {
    return (
      <div className="mt-2.5 space-y-1">
        {d.transactions.map((t: any, i: number) => (
          <div key={i} className="flex items-center justify-between rounded-lg bg-black/20 px-3 py-1.5 text-xs">
            <span className="text-text-muted truncate max-w-[60%]">{t.desc}</span>
            <span className={`font-mono ${t.type === "credit" ? "text-ok" : "text-text"}`}>
              {t.type === "credit" ? "+" : ""}
              {inr(t.amount)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (tool === "get_upcoming_dues" && d.dues) {
    return (
      <div className="mt-2.5 space-y-1">
        {d.dues.map((t: any, i: number) => (
          <div key={i} className="flex items-center justify-between rounded-lg bg-black/20 px-3 py-1.5 text-xs">
            <span className="text-text-muted">{t.payee}</span>
            <span className="font-mono text-text">{inr(t.amount)}</span>
          </div>
        ))}
      </div>
    );
  }

  if (tool === "get_health_score" && typeof d.overall === "number") {
    return (
      <div className="mt-2.5 rounded-lg bg-black/20 p-3">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold gradient-text">{d.overall}</div>
          <div className="text-xs text-text-muted">
            Grade {d.grade} · out of 100
          </div>
        </div>
        {d.insights && d.insights[0] && <p className="mt-2 text-xs text-text-muted">{d.insights[0]}</p>}
      </div>
    );
  }

  if (tool === "get_spend_breakdown" && d.breakdown) {
    const max = Math.max(...d.breakdown.map((b: any) => b.amount));
    return (
      <div className="mt-2.5 space-y-1.5">
        {d.breakdown.slice(0, 5).map((b: any, i: number) => (
          <div key={i}>
            <div className="flex justify-between text-[11px] text-text-muted mb-0.5">
              <span className="capitalize">{b.category}</span>
              <span className="font-mono">{inr(b.amount)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-black/30 overflow-hidden">
              <div className="h-full gradient-bg" style={{ width: `${(b.amount / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tool === "file_dispute" && d.dispute) {
    return (
      <div className="mt-2.5 rounded-lg bg-black/20 px-3 py-2 text-xs">
        <span className="text-text-muted">Case ID: </span>
        <span className="font-mono text-text">{d.dispute.id}</span>
      </div>
    );
  }

  if (tool === "explain_term" && d.example) {
    return (
      <div className="mt-2.5 rounded-lg bg-black/20 px-3 py-2 text-xs text-text-muted italic">{d.example}</div>
    );
  }

  return null;
}

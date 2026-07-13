import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  Bell,
  Calendar,
  Brain,
  Activity,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCcw,
} from "lucide-react";
import { LanguageSwitcher, UserSwitcher } from "../components/Switchers";
import { useSession } from "../config/session";
import { api, inr, relDate, type Overview } from "../lib/api";

export function Dashboard() {
  const { userId } = useSession();
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const o = await api.overview(userId);
      setData(o);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (loading || !data) {
    return (
      <div className="mx-auto max-w-6xl px-4 pt-28 pb-20">
        <div className="grid place-items-center h-64 text-text-muted">Loading…</div>
      </div>
    );
  }

  const { user, primary, accounts, healthScore, spendBreakdown, upcomingDues, recentTransactions, triggers, lifeContext } = data;
  const maxSpend = Math.max(...spendBreakdown.map((s) => s.amount), 1);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-24 pb-20">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            Namaste, <span className="gradient-text">{user.name.split(" ")[0]}</span>
          </h1>
          <p className="text-sm text-text-muted">
            {user.occupation} · {user.city}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="rounded-lg border border-border bg-bg-card p-2.5 text-text-muted hover:text-text transition-colors" title="Refresh">
            <RefreshCcw size={16} />
          </button>
          <LanguageSwitcher />
          <UserSwitcher />
        </div>
      </div>

      {/* Proactive triggers - the flagship feature, top of the page */}
      {triggers.length > 0 && (
        <div className="mb-6 space-y-2">
          {triggers.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-start gap-3 rounded-xl border p-4 ${
                t.severity === "high"
                  ? "border-danger/40 bg-danger/[0.06]"
                  : t.severity === "medium"
                  ? "border-warn/40 bg-warn/[0.05]"
                  : "border-border bg-bg-card"
              }`}
            >
              <div className={`grid place-items-center w-9 h-9 rounded-lg shrink-0 ${t.severity === "high" ? "bg-danger/20 text-danger" : t.severity === "medium" ? "bg-warn/20 text-warn" : "bg-indigo/20 text-indigo"}`}>
                {t.severity === "high" ? <AlertTriangle size={17} /> : <Bell size={17} />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-text">{t.title}</p>
                <p className="text-sm text-text-muted mt-0.5 font-hindi">{t.message}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Top grid: balance + health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Balance */}
        <div className="card card-glow p-5">
          <div className="flex items-center gap-2 text-text-muted text-sm mb-3">
            <Wallet size={16} /> Balance
          </div>
          <div className="text-3xl font-bold tracking-tight">{inr(primary.balance)}</div>
          <div className="mt-1 text-xs text-text-dim">{primary.type.replace("_", " ")} · {primary.number}</div>
          <div className="mt-4 space-y-1.5">
            {accounts.filter((a) => a.id !== primary.id).map((a) => (
              <div key={a.id} className="flex justify-between text-xs">
                <span className="text-text-muted capitalize">{a.type.replace("_", " ")}</span>
                <span className={`font-mono ${a.balance < 0 ? "text-danger" : "text-text"}`}>{inr(a.balance)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Health score */}
        <div className="card card-glow p-5 lg:col-span-2">
          <div className="flex items-center gap-2 text-text-muted text-sm mb-3">
            <Activity size={16} /> Financial Health Score
          </div>
          <div className="flex items-center gap-6">
            <div className="relative grid place-items-center">
              <svg width="96" height="96" viewBox="0 0 96 96">
                <circle cx="48" cy="48" r="40" fill="none" stroke="var(--color-border)" strokeWidth="8" />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  stroke="url(#hg)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(healthScore.overall / 100) * 251} 251`}
                  transform="rotate(-90 48 48)"
                />
                <defs>
                  <linearGradient id="hg" x1="0" y1="0" x2="96" y2="96">
                    <stop stopColor="#FF9D3D" />
                    <stop offset="0.5" stopColor="#F0509B" />
                    <stop offset="1" stopColor="#7C5CFF" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute text-center">
                <div className="text-2xl font-bold">{healthScore.overall}</div>
                <div className="text-[10px] text-text-muted">Grade {healthScore.grade}</div>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              {healthScore.dimensions.map((dim) => (
                <div key={dim.key}>
                  <div className="flex justify-between text-[11px] text-text-muted mb-0.5">
                    <span>{dim.label}</span>
                    <span className="font-mono">{dim.value}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-border overflow-hidden">
                    <div className="h-full gradient-bg" style={{ width: `${dim.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          {healthScore.insights[0] && (
            <p className="mt-4 text-xs text-text-muted border-t border-border pt-3">{healthScore.insights[0]}</p>
          )}
        </div>
      </div>

      {/* Middle grid: spend + dues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Spend breakdown */}
        <div className="card p-5">
          <div className="flex items-center gap-2 text-text-muted text-sm mb-4">
            <TrendingUp size={16} /> Where your money went (30 days)
          </div>
          <div className="space-y-3">
            {spendBreakdown.slice(0, 6).map((s) => (
              <div key={s.category}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="capitalize text-text">{s.category}</span>
                  <span className="font-mono text-text-muted">{inr(s.amount)}</span>
                </div>
                <div className="h-2 rounded-full bg-border overflow-hidden">
                  <div className="h-full gradient-bg" style={{ width: `${(s.amount / maxSpend) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming dues */}
        <div className="card p-5">
          <div className="flex items-center gap-2 text-text-muted text-sm mb-4">
            <Calendar size={16} /> Upcoming payments
          </div>
          <div className="space-y-2.5">
            {upcomingDues.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-lg bg-bg-elev px-3 py-2.5">
                <div>
                  <p className="text-sm text-text">{d.payee}</p>
                  <p className="text-[11px] text-text-dim">{relDate(d.nextDebit)} · {d.type}</p>
                </div>
                <span className="font-mono text-sm text-text">{inr(d.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom grid: recent txns + life context */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 text-text-muted text-sm mb-4">
            <Wallet size={16} /> Recent transactions
          </div>
          <div className="space-y-1">
            {recentTransactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-2.5">
                  <div className={`grid place-items-center w-7 h-7 rounded-lg ${t.type === "credit" ? "bg-ok/15 text-ok" : "bg-bg-elev text-text-muted"}`}>
                    {t.type === "credit" ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                  </div>
                  <div>
                    <p className="text-xs text-text truncate max-w-[180px]">{t.desc}</p>
                    <p className="text-[10px] text-text-dim">{relDate(t.date)} · {t.category}</p>
                  </div>
                </div>
                <span className={`font-mono text-sm ${t.type === "credit" ? "text-ok" : "text-text"}`}>
                  {t.type === "credit" ? "+" : ""}
                  {inr(t.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Life context memory */}
        <div className="card p-5">
          <div className="flex items-center gap-2 text-text-muted text-sm mb-4">
            <Brain size={16} /> What Vaani remembers
          </div>
          <div className="space-y-2.5">
            {lifeContext.map((c) => (
              <div key={c.key} className="rounded-lg bg-bg-elev px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-text">{c.label}</p>
                  {c.nextDate && <span className="text-[10px] text-magenta font-mono">{relDate(c.nextDate)}</span>}
                </div>
                <p className="text-[11px] text-text-muted mt-0.5">{c.note}</p>
              </div>
            ))}
            {lifeContext.length === 0 && <p className="text-xs text-text-dim">Nothing yet. Tell Vaani "remember that…" and it will show up here.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

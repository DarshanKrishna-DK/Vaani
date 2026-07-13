import { motion } from "framer-motion";
import { Mic, LayoutDashboard, BookOpen } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Logo } from "./Logo";
import { useSession } from "../config/session";

export function Navbar() {
  const location = useLocation();
  const { aiMode } = useSession();
  const path = location.pathname;

  const links = [
    { to: "/talk", label: "Talk to Vaani", icon: Mic },
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/how", label: "How it works", icon: BookOpen },
  ];

  return (
    <motion.nav
      initial={{ y: -18, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-bg/70 backdrop-blur-2xl"
    >
      <div className="mx-auto max-w-7xl flex items-center justify-between px-5 py-3.5">
        <Link to="/" className="flex items-center">
          <Logo />
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => {
            const active = path === l.to;
            const Icon = l.icon;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                  active ? "text-text bg-bg-card" : "text-text-muted hover:text-text"
                }`}
              >
                <Icon size={15} />
                {l.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          {aiMode && (
            <span
              className="hidden sm:flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-[11px] font-mono text-text-muted"
              title={aiMode === "groq" ? "Live LLM via Groq" : "Deterministic fallback planner (set GROQ_API_KEY for live LLM)"}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${aiMode === "groq" ? "bg-ok" : "bg-warn"}`} />
              {aiMode === "groq" ? "Groq AI" : "Local mode"}
            </span>
          )}
          <Link
            to="/talk"
            className="flex items-center gap-2 rounded-lg gradient-bg px-4 py-2 text-sm font-semibold text-bg hover:opacity-90 transition-opacity"
          >
            <Mic size={14} />
            Start
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}

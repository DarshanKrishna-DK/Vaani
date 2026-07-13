import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-bg-footer mt-10">
      <div className="mx-auto max-w-7xl px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col items-center md:items-start gap-1.5">
          <Logo size={28} />
          <p className="text-xs text-text-dim">Hands-free banking for India's next billion.</p>
        </div>
        <div className="text-xs text-text-dim text-center md:text-right">
          <p>Built for IDBI Innovate 2026 · Team Vaani</p>
          <p className="mt-1">MVP · Groq + Web Speech + in-memory store (Supabase-ready)</p>
        </div>
      </div>
    </footer>
  );
}

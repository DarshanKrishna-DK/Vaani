import { useState, useEffect } from "react";
import { Globe, ChevronDown, User } from "lucide-react";
import { LANGUAGES, useSession, type Lang } from "../config/session";
import { api } from "../lib/api";

export function LanguageSwitcher() {
  const { language, setLanguage, userId } = useSession();
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find((l) => l.code === language)!;

  async function choose(code: Lang) {
    setLanguage(code);
    setOpen(false);
    try {
      await api.updateUser(userId, { preferredLanguage: code });
    } catch {
      /* non-blocking */
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-text hover:border-border-hover transition-colors"
      >
        <Globe size={15} className="text-text-muted" />
        <span className="font-hindi">{current.native}</span>
        <ChevronDown size={14} className="text-text-muted" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-xl border border-border bg-bg-elev p-1.5 shadow-2xl z-50">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => choose(l.code)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                l.code === language ? "bg-bg-card text-text" : "text-text-muted hover:text-text hover:bg-bg-card"
              }`}
            >
              <span>{l.label}</span>
              <span className="font-hindi text-text-muted">{l.native}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function UserSwitcher() {
  const { userId, setUserId } = useSession();
  const [users, setUsers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api.users().then((d) => setUsers(d.users)).catch(() => {});
  }, []);

  const current = users.find((u) => u.id === userId);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-text hover:border-border-hover transition-colors"
      >
        <span className="grid place-items-center w-6 h-6 rounded-full gradient-bg text-bg">
          <User size={13} />
        </span>
        <span className="max-w-[120px] truncate">{current ? current.name : "Select user"}</span>
        <ChevronDown size={14} className="text-text-muted" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-60 rounded-xl border border-border bg-bg-elev p-1.5 shadow-2xl z-50">
          {users.map((u) => (
            <button
              key={u.id}
              onClick={() => {
                setUserId(u.id);
                setOpen(false);
              }}
              className={`flex w-full flex-col items-start rounded-lg px-3 py-2 text-sm transition-colors ${
                u.id === userId ? "bg-bg-card text-text" : "text-text-muted hover:text-text hover:bg-bg-card"
              }`}
            >
              <span className="font-medium text-text">{u.name}</span>
              <span className="text-xs text-text-dim">
                {u.occupation} · {u.city}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Lang = "hi" | "en" | "hinglish" | "ta" | "mr";

export const LANGUAGES: { code: Lang; label: string; native: string }[] = [
  { code: "hinglish", label: "Hinglish", native: "Hinglish" },
  { code: "hi", label: "Hindi", native: "हिंदी" },
  { code: "en", label: "English", native: "English" },
  { code: "ta", label: "Tamil", native: "தமிழ்" },
  { code: "mr", label: "Marathi", native: "मराठी" },
];

interface SessionState {
  userId: string;
  setUserId: (id: string) => void;
  language: Lang;
  setLanguage: (l: Lang) => void;
  aiMode: string;
  setAiMode: (m: string) => void;
}

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string>("user_ramesh");
  const [language, setLanguage] = useState<Lang>("hinglish");
  const [aiMode, setAiMode] = useState<string>("");

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((d) => setAiMode(d.aiMode))
      .catch(() => setAiMode("fallback"));
  }, []);

  return (
    <SessionContext.Provider value={{ userId, setUserId, language, setLanguage, aiMode, setAiMode }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}

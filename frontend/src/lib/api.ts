// Vaani API client. Talks to the backend at /api (proxied in dev).

const BASE = "/api";

export interface Account {
  id: string;
  type: string;
  number: string;
  balance: number;
  currency: string;
  maturityDate?: string;
}

export interface Txn {
  id: string;
  date: string;
  desc: string;
  amount: number;
  type: "credit" | "debit";
  category: string;
}

export interface Due {
  id: string;
  payee: string;
  amount: number;
  nextDebit: string;
  type: string;
}

export interface Trigger {
  type: string;
  severity: "high" | "medium" | "low";
  title: string;
  message: string;
  data: any;
  suggestedAction: string | null;
}

export interface HealthDim {
  key: string;
  label: string;
  value: number;
}

export interface HealthScore {
  overall: number;
  grade: string;
  dimensions: HealthDim[];
  metrics: Record<string, number>;
  insights: string[];
}

export interface Overview {
  user: any;
  accounts: Account[];
  primary: Account;
  recentTransactions: Txn[];
  upcomingDues: Due[];
  healthScore: HealthScore;
  spendBreakdown: { category: string; amount: number }[];
  triggers: Trigger[];
  lifeContext: { key: string; label: string; note: string; nextDate: string | null }[];
}

export interface AgentResult {
  reply: string;
  toolCalls?: { name: string; args: any; result: { ok: boolean; summary: string } }[];
  needsConfirmation?: boolean;
  needsInput?: boolean;
  action?: string | null;
  data?: any;
  fallback?: boolean;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

async function post<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return res.json();
}

export const api = {
  status: () => get<{ ok: boolean; aiMode: string }>("/status"),
  users: () => get<{ users: any[] }>("/users"),
  overview: (userId: string) => get<Overview>(`/users/${userId}/overview`),
  transactions: (userId: string, limit = 50) => get<{ transactions: Txn[] }>(`/users/${userId}/transactions?limit=${limit}`),
  health: (userId: string) => get<HealthScore>(`/users/${userId}/health`),
  spend: (userId: string) => get<{ breakdown: { category: string; amount: number }[] }>(`/users/${userId}/spend`),
  triggers: (userId: string) => get<{ triggers: Trigger[] }>(`/users/${userId}/triggers`),
  dues: (userId: string) => get<{ dues: Due[] }>(`/users/${userId}/dues`),
  payees: (userId: string) => get<{ payees: any[] }>(`/users/${userId}/payees`),
  disputes: (userId: string) => get<{ disputes: any[] }>(`/users/${userId}/disputes`),
  context: (userId: string) => get<{ lifeContext: any[] }>(`/users/${userId}/context`),
  audit: (userId: string) => get<{ audit: any[] }>(`/users/${userId}/audit`),
  terms: () => get<{ terms: string[] }>("/terms"),
  turn: (body: { userId: string; text: string; language?: string; history?: any[] }) => post<AgentResult>("/agent/turn", body),
  confirm: (body: { userId: string; action: string; args: any }) => post<AgentResult>("/agent/confirm", body),
  updateUser: async (userId: string, patch: any) => {
    const res = await fetch(`${BASE}/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error("update failed");
    return res.json();
  },
  reset: () => post<{ ok: boolean }>("/reset", {}),
};

// helpers
export function inr(n: number): string {
  const sign = n < 0 ? "-" : "";
  return `${sign}₹${Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function relDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const days = Math.round((d.getTime() - now.getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  if (days < 0) return `${Math.abs(days)}d ago`;
  return `In ${days}d`;
}

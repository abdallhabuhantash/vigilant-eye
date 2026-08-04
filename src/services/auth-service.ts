/**
 * Prototype auth service. Session state only lives in the browser during the
 * UI stage; it is replaced by Supabase email/password auth later without any
 * change to the consuming hooks or route guards.
 */
import type { AppUser, AuthSession } from "@/types";
import { mockUsers } from "./mock/mock-data";

const STORAGE_KEY = "sentinel.session";
const DEMO_PASSWORD = "demo1234";

type Listener = () => void;
const listeners = new Set<Listener>();
let cached: AuthSession | null | undefined;

function read(): AuthSession | null {
  if (typeof window === "undefined") return null;
  if (cached !== undefined) return cached;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  cached = raw ? (JSON.parse(raw) as AuthSession) : null;
  return cached;
}

function write(session: AuthSession | null): void {
  cached = session;
  if (typeof window === "undefined") return;
  if (session) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  else window.localStorage.removeItem(STORAGE_KEY);
  listeners.forEach((listener) => listener());
}

export const authService = {
  demoPassword: DEMO_PASSWORD,
  getSession: (): AuthSession | null => read(),
  subscribe: (listener: Listener): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  signIn: async (email: string, password: string): Promise<AppUser> => {
    await new Promise((resolve) => setTimeout(resolve, 350));
    const user = mockUsers.find(
      (candidate) => candidate.email.toLowerCase() === email.trim().toLowerCase(),
    );
    if (!user || password !== DEMO_PASSWORD) {
      throw new Error("Invalid credentials.");
    }
    if (user.status !== "active") {
      throw new Error("This account is suspended.");
    }
    write({ user, issuedAt: new Date().toISOString() });
    return user;
  },
  signOut: (): void => write(null),
};
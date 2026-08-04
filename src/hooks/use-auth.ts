import { useSyncExternalStore } from "react";
import { authService } from "@/services/auth-service";
import type { AuthSession, UserRole } from "@/types";

const emptySnapshot = (): AuthSession | null => null;

export function useAuth() {
  const session = useSyncExternalStore(
    authService.subscribe,
    authService.getSession,
    emptySnapshot,
  );

  const role: UserRole | null = session?.user.role ?? null;

  return {
    session,
    user: session?.user ?? null,
    role,
    isAdministrator: role === "administrator",
    isAuthenticated: session !== null,
    signIn: authService.signIn,
    signOut: authService.signOut,
  };
}
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { mockAuthService } from "./mock-auth";
import type { AuthResult, Credentials, User } from "./types";

type AuthContextValue = {
  user: User | null;
  /** false until the persisted session has been checked on the client */
  ready: boolean;
  isAuthenticated: boolean;
  signIn: (credentials: Credentials) => Promise<AuthResult>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const authService = mockAuthService;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(authService.restore());
    setReady(true);
  }, []);

  const signIn = useCallback(async (credentials: Credentials) => {
    const result = await authService.signIn(credentials);
    if (result.ok) setUser(result.user);
    return result;
  }, []);

  const signOut = useCallback(async () => {
    await authService.signOut();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, ready, isAuthenticated: Boolean(user), signIn, signOut }),
    [user, ready, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

export function initials(user: User) {
  return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
}
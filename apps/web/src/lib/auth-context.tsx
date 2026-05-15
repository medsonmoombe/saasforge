"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

interface AuthState {
  token: string | null;
  userId: string | null;
  orgId: string | null;
}

interface AuthContextValue extends AuthState {
  setAuth: (token: string, userId: string, orgId: string | null) => void;
  switchingOrg: boolean;
  setSwitchingOrg: (v: boolean) => void;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuthState] = useState<AuthState>({ token: null, userId: null, orgId: null });
  const [switchingOrg, setSwitchingOrg] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    const orgId = localStorage.getItem("orgId");
    if (token && userId) setAuthState({ token, userId, orgId });
  }, []);

  const setAuth = useCallback((token: string, userId: string, orgId: string | null) => {
    localStorage.setItem("token", token);
    localStorage.setItem("userId", userId);
    if (orgId) localStorage.setItem("orgId", orgId);
    else localStorage.removeItem("orgId");
    setAuthState({ token, userId, orgId });
  }, []);

  const clearAuth = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("orgId");
    setAuthState({ token: null, userId: null, orgId: null });
  }, []);

  return (
    <AuthContext.Provider value={{ ...auth, setAuth, clearAuth, switchingOrg, setSwitchingOrg }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}

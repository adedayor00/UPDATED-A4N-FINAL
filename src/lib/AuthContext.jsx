import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "@/api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setUser(await api.auth.getUser());
    } catch {
      setUser(null);
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    return api.auth.onChange(refresh);
  }, [refresh]);

  const signIn = async (email, password) => {
    const u = await api.auth.signIn(email, password);
    setUser(u);
    return u;
  };

  const logout = async () => {
    await api.auth.signOut();
    setUser(null);
  };

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, isAdmin, isLoadingAuth, signIn, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

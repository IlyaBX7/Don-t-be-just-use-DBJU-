"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../lib/api";
import type { CurrentUser, ProfileStats } from "../types/user";
import { AuthModal } from "./AuthModal";

type AuthMode = "LOGIN" | "REGISTER";

interface AppContextValue {
  user: CurrentUser | null;
  loading: boolean;
  isPlus: boolean;
  setUser: (u: CurrentUser | null) => void;
  logout: () => Promise<void>;
  // Відкриває вікно входу; onSuccess викликається після успішного входу
  openAuth: (mode?: AuthMode, onSuccess?: () => void) => void;
  favoriteIds: Set<string>;
  toggleFavorite: (productId: string) => Promise<void>;
  stats: ProfileStats | null;
  refreshStats: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("LOGIN");
  const afterAuth = useRef<(() => void) | null>(null);

  const loadSession = useCallback(async () => {
    try {
      const data = await api<{ user: CurrentUser | null; favoriteIds: string[] }>("/api/auth/me");
      setUser(data.user);
      setFavoriteIds(new Set(data.favoriteIds));
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshStats = useCallback(async () => {
    try {
      setStats(await api<ProfileStats>("/api/profile/stats"));
    } catch {
      setStats(null);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- завантаження сесії з сервера при старті
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- лічильники з сервера для нового користувача
      refreshStats();
    } else {
      setStats(null);
    }
  }, [user, refreshStats]);

  const openAuth = useCallback((mode: AuthMode = "LOGIN", onSuccess?: () => void) => {
    afterAuth.current = onSuccess ?? null;
    setAuthMode(mode);
    setAuthOpen(true);
  }, []);

  const logout = useCallback(async () => {
    await api("/api/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
    setFavoriteIds(new Set());
  }, []);

  const toggleFavorite = useCallback(
    async (productId: string) => {
      if (!user) {
        openAuth("LOGIN");
        return;
      }
      const next = !favoriteIds.has(productId);
      const update = (add: boolean) =>
        setFavoriteIds((prev) => {
          const s = new Set(prev);
          if (add) s.add(productId);
          else s.delete(productId);
          return s;
        });
      update(next); // оптимістично
      try {
        await api("/api/favorites", { method: "PUT", json: { productId, favorite: next } });
        refreshStats();
      } catch {
        update(!next);
      }
    },
    [user, favoriteIds, openAuth, refreshStats]
  );

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      loading,
      isPlus: Boolean(user?.plusUntil && new Date(user.plusUntil) > new Date()),
      setUser,
      logout,
      openAuth,
      favoriteIds,
      toggleFavorite,
      stats,
      refreshStats,
    }),
    [user, loading, logout, openAuth, favoriteIds, toggleFavorite, stats, refreshStats]
  );

  return (
    <AppContext.Provider value={value}>
      {children}
      <AuthModal
        isOpen={authOpen}
        initialMode={authMode}
        onClose={() => setAuthOpen(false)}
        onSuccess={async () => {
          await loadSession();
          const cb = afterAuth.current;
          afterAuth.current = null;
          cb?.();
        }}
      />
    </AppContext.Provider>
  );
}

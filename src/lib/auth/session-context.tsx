"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useTransition,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { browserApi } from "@/lib/http/browser";
import { useIdleTimeout, clearActivity } from "./use-idle-timeout";
import type { User } from "@/types/auth";

/**
 * Estado de sessão no client — enxuto de propósito: guarda apenas o `user`.
 * O token vive no cookie httpOnly e nunca entra aqui.
 *
 * O `user` inicial vem do servidor (via layout) para evitar flash de
 * "deslogado" no primeiro render.
 */

interface SessionContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isPending: boolean;
  /** Revalida o usuário atual contra `/api/auth/session`. */
  refresh: () => Promise<void>;
  /** Encerra a sessão e redireciona para /login. */
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({
  initialUser = null,
  children,
}: {
  initialUser?: User | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(initialUser);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    try {
      const { user: fresh } = await browserApi.get<{ user: User | null }>(
        "auth/session",
      );
      setUser(fresh);
    } catch {
      setUser(null);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await browserApi.post("auth/logout");
    } finally {
      clearActivity();
      setUser(null);
      startTransition(() => {
        router.replace("/login");
        router.refresh();
      });
    }
  }, [router]);

  /** Sessão expirou por inatividade: volta ao login preservando a rota atual. */
  const expireSession = useCallback(() => {
    clearActivity();
    setUser(null);
    const next = pathname && pathname !== "/login" ? `?next=${encodeURIComponent(pathname)}` : "";
    startTransition(() => {
      router.replace(`/login${next}`);
      router.refresh();
    });
  }, [pathname, router]);

  useIdleTimeout({ active: user !== null, onExpire: expireSession });

  const value = useMemo<SessionContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isPending,
      refresh,
      logout,
    }),
    [user, isPending, refresh, logout],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession deve ser usado dentro de <SessionProvider>");
  }
  return ctx;
}

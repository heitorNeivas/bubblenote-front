"use client";

import { useEffect, useRef } from "react";
import { clientEnv } from "@/config/env.client";
import { browserApi } from "@/lib/http/browser";
import { isApiError } from "@/lib/http/api-error";

/**
 * Expiração de sessão por inatividade — camada de UX.
 *
 * A imposição real é o cookie httpOnly `granito_session` (`SESSION_IDLE_TIMEOUT`
 * no servidor, deslizado a cada chamada autenticada). Este hook só melhora a
 * experiência: enquanto o usuário interage, faz um heartbeat em
 * `POST /api/auth/touch` para deslizar o cookie mesmo sem chamadas à API; e
 * quando a janela estoura, redireciona na hora em vez de deixar a aba aberta
 * com a UI quebrada até a próxima requisição.
 *
 * O timestamp da última atividade vive no `localStorage` (chave abaixo), então
 * é compartilhado entre abas: atividade em qualquer uma mantém todas vivas.
 */

const STORAGE_KEY = "granito:lastActivityAt";
const IDLE_MS = clientEnv.NEXT_PUBLIC_SESSION_IDLE_TIMEOUT * 1000;
const CHECK_INTERVAL_MS = 30_000;
/** Espaçamento mínimo entre heartbeats enquanto há atividade. */
const HEARTBEAT_MS = 2 * 60_000;

function readLastActivity(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

/** Marca "agora" como última atividade. Chamar no login bem-sucedido. */
export function markActivity(): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    /* modo privado / storage bloqueado: seguimos só com o timer em memória */
  }
}

/** Limpa a marca de atividade. Chamar no logout. */
export function clearActivity(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* idem */
  }
}

export function useIdleTimeout({
  active,
  onExpire,
}: {
  active: boolean;
  onExpire: () => void;
}): void {
  const onExpireRef = useRef(onExpire);
  const lastBeatRef = useRef(0);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (!active) return;

    // Sessão vinda do SSR sem marca local ainda: inicia a janela agora.
    if (readLastActivity() === 0) markActivity();

    const expired = () => {
      const last = readLastActivity();
      return last > 0 && Date.now() - last > IDLE_MS;
    };

    const check = () => {
      if (expired()) {
        clearActivity();
        onExpireRef.current();
      }
    };

    const bump = () => {
      if (document.visibilityState === "hidden") return;
      if (expired()) return check();
      const now = Date.now();
      markActivity();
      if (now - lastBeatRef.current > HEARTBEAT_MS) {
        lastBeatRef.current = now;
        browserApi.post("auth/touch").catch((cause) => {
          if (isApiError(cause) && cause.status === 401) {
            clearActivity();
            onExpireRef.current();
          }
        });
      }
    };

    const onStorage = (e: StorageEvent) => {
      // Atividade/heartbeat em outra aba: aproveita a marca compartilhada e
      // evita heartbeat redundante nesta aba.
      if (e.key === STORAGE_KEY && e.newValue) lastBeatRef.current = Date.now();
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };

    window.addEventListener("pointerdown", bump, { passive: true });
    window.addEventListener("keydown", bump, { passive: true });
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisible);
    const intervalId = window.setInterval(check, CHECK_INTERVAL_MS);
    check();

    return () => {
      window.removeEventListener("pointerdown", bump);
      window.removeEventListener("keydown", bump);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(intervalId);
    };
  }, [active]);
}

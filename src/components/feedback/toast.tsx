"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils/cn";
import { toUserMessage } from "@/lib/http/api-error";

/**
 * Feedback visual mínimo para falhas de API (e sucessos pontuais).
 * Uso: `const toast = useToast(); toast.error(err)` ou `toast.success("Salvo")`.
 */

type ToastKind = "error" | "success" | "info";

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  push: (kind: ToastKind, message: string) => void;
  success: (message: string) => void;
  info: (message: string) => void;
  /** Aceita `ApiError`, `Error` ou string e extrai a mensagem amigável. */
  error: (error: unknown) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const STYLES: Record<ToastKind, string> = {
  error: "border-red-500/40 bg-red-500/15 text-red-200",
  success: "border-emerald-500/40 bg-emerald-500/15 text-emerald-200",
  info: "border-border-strong bg-bg-elevated text-text-base",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = ++seq.current;
      setItems((current) => [...current, { id, kind, message }]);
      setTimeout(() => dismiss(id), 5000);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      push,
      success: (m) => push("success", m),
      info: (m) => push("info", m),
      error: (e) => push("error", toUserMessage(e)),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
        {items.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => dismiss(t.id)}
            className={cn(
              "pointer-events-auto rounded-lg border px-4 py-3 text-left text-sm shadow-lg backdrop-blur transition",
              STYLES[t.kind],
            )}
          >
            {t.message}
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast deve ser usado dentro de <ToastProvider>");
  return ctx;
}

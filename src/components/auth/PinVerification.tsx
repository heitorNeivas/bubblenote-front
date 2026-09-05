"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Tela de verificação em duas etapas (código PIN / OTP).
 *
 * Só a UI + a mecânica dos campos. A conferência do código é
 * responsabilidade do backend — o pai passa `onSubmit(code)` e sinaliza
 * código inválido lançando um erro (a mensagem vira o texto de erro).
 */

const RESEND_SECONDS = 30;

export interface PinVerificationProps {
  /** E-mail para onde o código foi enviado (exibido ao usuário). */
  email: string;
  /** Quantidade de dígitos. */
  length?: number;
  /** Confere o código. Lançar erro = código inválido (mensagem exibida). */
  onSubmit: (code: string) => Promise<void> | void;
  /** Reenviar o código. */
  onResend?: () => Promise<void> | void;
  /** Voltar para o passo anterior. */
  onBack?: () => void;
}

export function PinVerification({
  email,
  length = 6,
  onSubmit,
  onResend,
  onBack,
}: PinVerificationProps) {
  const [digits, setDigits] = useState<string[]>(() => Array(length).fill(""));
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);

  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const code = useMemo(() => digits.join(""), [digits]);
  const complete = code.length === length;

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const submit = useCallback(
    async (value: string) => {
      if (value.length !== length || verifying) return;
      setVerifying(true);
      setError(null);
      try {
        await onSubmit(value);
      } catch (err) {
        setError(
          err instanceof Error && err.message
            ? err.message
            : "Não foi possível verificar o código.",
        );
        setDigits(Array(length).fill(""));
        inputs.current[0]?.focus();
      } finally {
        setVerifying(false);
      }
    },
    [length, onSubmit, verifying],
  );

  /** Aplica os novos dígitos e dispara a verificação quando completa. */
  function commit(next: string[]) {
    setDigits(next);
    if (next.every((d) => d !== "")) void submit(next.join(""));
  }

  function handleChange(index: number, raw: string) {
    const only = raw.replace(/\D/g, "");
    if (!only) {
      const next = [...digits];
      next[index] = "";
      setDigits(next);
      return;
    }
    // Um dígito ou colagem de vários: distribui a partir do campo atual.
    const next = [...digits];
    for (let i = 0; i < only.length && index + i < length; i++) {
      next[index + i] = only[i];
    }
    const landed = Math.min(index + only.length, length - 1);
    inputs.current[landed]?.focus();
    commit(next);
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      e.preventDefault();
      const next = [...digits];
      next[index - 1] = "";
      setDigits(next);
      inputs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
  }

  async function handleResend() {
    if (cooldown > 0 || !onResend) return;
    await onResend();
    setDigits(Array(length).fill(""));
    setError(null);
    setCooldown(RESEND_SECONDS);
    inputs.current[0]?.focus();
  }

  return (
    <div className="flex flex-col gap-5">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="-ml-1 flex w-fit items-center gap-1 text-sm text-text-muted transition hover:text-text-base"
        >
          <span aria-hidden>←</span> Voltar
        </button>
      ) : null}

      <div>
        <h2 className="text-base font-semibold tracking-tight">
          Verificação em duas etapas
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          Digite o código de {length} dígitos enviado para{" "}
          <span className="text-text-base">{email}</span>.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit(code);
        }}
        className="flex flex-col gap-4"
      >
        <div className="flex justify-between gap-2">
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              maxLength={1}
              value={digit}
              disabled={verifying}
              aria-label={`Dígito ${i + 1}`}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onFocus={(e) => e.target.select()}
              className={cn(
                "h-12 w-full min-w-0 rounded-md border bg-bg-elevated text-center text-lg font-medium",
                "outline-none transition focus:border-accent",
                error ? "border-[var(--danger)]" : "border-border-strong",
                "disabled:opacity-50",
              )}
            />
          ))}
        </div>

        {error ? <p className="text-xs text-[var(--danger)]">{error}</p> : null}

        <button
          type="submit"
          disabled={!complete || verifying}
          className="mt-1 rounded-md bg-accent px-4 py-2 text-sm font-medium text-black transition hover:bg-accent-hover disabled:opacity-50"
        >
          {verifying ? "Verificando…" : "Verificar"}
        </button>
      </form>

      {onResend ? (
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0}
          className="text-sm text-text-muted transition hover:text-text-base disabled:opacity-60 disabled:hover:text-text-muted"
        >
          {cooldown > 0 ? `Reenviar código em ${cooldown}s` : "Reenviar código"}
        </button>
      ) : null}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { browserApi } from "@/lib/http/browser";
import { useSession } from "@/lib/auth/session-context";
import { markActivity } from "@/lib/auth/use-idle-timeout";
import { useToast } from "@/components/feedback/toast";
import { isApiError } from "@/lib/http/api-error";
import type { LoginInput, User } from "@/types/auth";
import { Field, inputClass } from "./fields";

/**
 * Formulário de login. Envia as credenciais ao BFF (`POST /api/auth/login`),
 * que grava o cookie httpOnly e devolve apenas o `user`.
 *
 * Sem validação de regra de negócio no client — o Laravel valida e os erros
 * (`422 { message, errors }`) voltam para cá já renderizados por campo.
 */
export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const { refresh } = useSession();

  const [values, setValues] = useState<LoginInput>({
    email: "",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFieldErrors({});
    setSubmitting(true);
    try {
      await browserApi.post<{ user: User }>("auth/login", values);
      markActivity();
      await refresh();
      const next = params.get("next");
      router.replace(next && next.startsWith("/") ? next : "/");
      router.refresh();
    } catch (error) {
      if (isApiError(error) && error.fieldErrors) {
        setFieldErrors(error.fieldErrors);
      }
      toast.error(error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field label="E-mail" error={fieldErrors.email?.[0]}>
        <input
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
          className={inputClass}
          required
        />
      </Field>

      <Field label="Senha" error={fieldErrors.password?.[0]}>
        <input
          type="password"
          autoComplete="current-password"
          value={values.password}
          onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
          className={inputClass}
          required
        />
      </Field>

      <p className="text-xs text-text-muted">
        Por segurança, a sessão expira após 1&nbsp;hora sem atividade.
      </p>

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-black transition hover:bg-accent-hover disabled:opacity-50"
      >
        {submitting ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}

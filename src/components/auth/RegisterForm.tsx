"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { browserApi } from "@/lib/http/browser";
import { useSession } from "@/lib/auth/session-context";
import { useToast } from "@/components/feedback/toast";
import { isApiError } from "@/lib/http/api-error";
import type { RegisterInput } from "@/types/auth";
import { Field, inputClass } from "./fields";
import { PinVerification } from "./PinVerification";

/**
 * Formulário de registro. Envia ao BFF (`POST /api/auth/register`), que
 * encaminha ao Laravel. Toda a validação (`required`, `email`, `confirmed`,
 * `unique`…) é do Laravel — os erros voltam em `422 { message, errors }` e são
 * renderizados por campo.
 *
 * O cadastro fica PENDENTE: o Laravel dispara um código por e-mail e só cria a
 * sessão depois que o PIN é verificado em `POST /api/auth/register/verify`.
 */
export function RegisterForm({
  onStepChange,
}: {
  /** Avisa o pai quando entra/sai do passo de verificação (p/ esconder abas). */
  onStepChange?: (step: "form" | "pin") => void;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const { refresh } = useSession();

  const [step, setStep] = useState<"form" | "pin">("form");
  const [values, setValues] = useState<RegisterInput>({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);

  function goHome() {
    const next = params.get("next");
    router.replace(next && next.startsWith("/") ? next : "/");
    router.refresh();
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFieldErrors({});
    setSubmitting(true);
    try {
      await browserApi.post("auth/register", values);
      setStep("pin");
    } catch (error) {
      if (isApiError(error) && error.fieldErrors) {
        setFieldErrors(error.fieldErrors);
      }
      toast.error(error);
    } finally {
      setSubmitting(false);
    }
  }

  async function verifyPin(code: string) {
    // Lança ApiError em não-2xx -> PinVerification exibe error.message
    // (as mensagens do Laravel: "Código inválido.", "Cadastro não encontrado
    // ou expirado…", "Muitas requisições…").
    await browserApi.post("auth/register/verify", { email: values.email, code });
    await refresh();
    goHome();
  }

  async function resendPin() {
    try {
      await browserApi.post("auth/register/resend", { email: values.email });
      toast.success("Enviamos um novo código.");
    } catch (error) {
      toast.error(error);
    }
  }

  if (step === "pin") {
    return (
      <PinVerification
        email={values.email}
        onSubmit={verifyPin}
        onResend={resendPin}
        onBack={() => setStep("form")}
      />
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field label="Nome" error={fieldErrors.name?.[0]}>
        <input
          type="text"
          autoComplete="name"
          value={values.name}
          onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
          className={inputClass}
          required
        />
      </Field>

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
          autoComplete="new-password"
          value={values.password}
          onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
          className={inputClass}
          required
        />
      </Field>

      <Field
        label="Confirmar senha"
        error={fieldErrors.password_confirmation?.[0]}
      >
        <input
          type="password"
          autoComplete="new-password"
          value={values.password_confirmation}
          onChange={(e) =>
            setValues((v) => ({ ...v, password_confirmation: e.target.value }))
          }
          className={inputClass}
          required
        />
      </Field>

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-black transition hover:bg-accent-hover disabled:opacity-50"
      >
        {submitting ? "Criando conta…" : "Criar conta"}
      </button>
    </form>
  );
}
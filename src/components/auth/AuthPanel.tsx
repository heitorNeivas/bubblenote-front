"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { cn } from "@/lib/utils/cn";

type Tab = "login" | "register";

const TABS: { id: Tab; label: string }[] = [
  { id: "login", label: "Entrar" },
  { id: "register", label: "Criar conta" },
];

/** Painel de autenticação com abas Entrar / Criar conta. */
export function AuthPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const initial: Tab = params.get("tab") === "register" ? "register" : "login";
  const [tab, setTab] = useState<Tab>(initial);
  // Esconde as abas durante a verificação em duas etapas do cadastro.
  const [registerStep, setRegisterStep] = useState<"form" | "pin">("form");

  function select(next: Tab) {
    setTab(next);
    const query = new URLSearchParams(params);
    if (next === "register") query.set("tab", "register");
    else query.delete("tab");
    const qs = query.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const hideTabs = tab === "register" && registerStep === "pin";

  return (
    <div>
      {hideTabs ? null : (
        <div
          role="tablist"
          aria-label="Autenticação"
          className="mb-6 flex gap-1 rounded-lg border border-border-base bg-bg-elevated p-1"
        >
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              role="tab"
              type="button"
              aria-selected={tab === id}
              onClick={() => select(id)}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition",
                tab === id
                  ? "bg-accent text-black"
                  : "text-text-muted hover:text-text-base",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {tab === "login" ? (
        <LoginForm />
      ) : (
        <RegisterForm onStepChange={setRegisterStep} />
      )}
    </div>
  );
}

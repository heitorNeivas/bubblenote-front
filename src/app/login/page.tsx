import type { Metadata } from "next";
import { Suspense } from "react";
import { redirectIfAuthenticated } from "@/lib/auth/session";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { clientEnv } from "@/config/env.client";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage() {
  await redirectIfAuthenticated();

  return (
    <main className="flex min-h-full items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-lg font-semibold tracking-tight">
            {clientEnv.NEXT_PUBLIC_APP_NAME}
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Sua base de conhecimento em Markdown
          </p>
        </div>
        <Suspense>
          <AuthPanel />
        </Suspense>
      </div>
    </main>
  );
}

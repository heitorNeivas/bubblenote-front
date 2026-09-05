"use client";

import { SessionProvider } from "@/lib/auth/session-context";
import { ToastProvider } from "@/components/feedback/toast";
import { BubblesProvider } from "@/lib/bubbles/bubbles-context";
import type { User } from "@/types/auth";

/**
 * Composição dos providers client-side: feedback, sessão e bolhas.
 * O `initialUser` é resolvido no servidor (layout) e injetado aqui.
 */
export function Providers({
  initialUser,
  children,
}: {
  initialUser: User | null;
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <SessionProvider initialUser={initialUser}>
        <BubblesProvider>{children}</BubblesProvider>
      </SessionProvider>
    </ToastProvider>
  );
}

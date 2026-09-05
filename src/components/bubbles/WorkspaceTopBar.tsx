"use client";

import { clientEnv } from "@/config/env.client";
import { LogoutButton } from "@/components/auth/LogoutButton";

/** Barra fina do topo do workspace. */
export function WorkspaceTopBar() {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-4 px-4 py-3">
      <span className="pointer-events-auto rounded-md bg-bg-elevated/80 px-2.5 py-1 text-sm font-semibold tracking-tight backdrop-blur">
        {clientEnv.NEXT_PUBLIC_APP_NAME}
      </span>
      <div className="pointer-events-auto">
        <LogoutButton />
      </div>
    </header>
  );
}

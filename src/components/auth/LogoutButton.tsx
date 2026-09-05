"use client";

import { useSession } from "@/lib/auth/session-context";

export function LogoutButton() {
  const { logout, isPending } = useSession();

  return (
    <button
      type="button"
      onClick={() => logout()}
      disabled={isPending}
      className="rounded-md border border-border-strong px-4 py-2 text-sm transition hover:bg-bg-hover disabled:opacity-50"
    >
      {isPending ? "Saindo…" : "Sair"}
    </button>
  );
}

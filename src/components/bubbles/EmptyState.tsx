"use client";

import { useBubbles } from "@/lib/bubbles/bubbles-context";

/** Primeira tela: só o convite para criar a primeira bolha. */
export function EmptyState() {
  const { createBubble, loadExample } = useBubbles();

  function createFirst() {
    // Não navega: a bolha aparece no canvas (com a animação de aparição);
    // clicar nela abre a nota.
    void createBubble({ x: 0, y: 0 });
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="max-w-sm">
        <h1 className="text-lg font-semibold tracking-tight">
          Comece pela primeira bolha
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Cada bolha guarda uma anotação. Ligue umas nas outras e o
          conhecimento vira um mapa.
        </p>
      </div>

      <button
        type="button"
        onClick={createFirst}
        className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-black transition hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        + Crie sua primeira bolha!
      </button>

      <button
        type="button"
        onClick={loadExample}
        className="text-xs text-text-muted underline-offset-4 transition hover:text-text-base hover:underline"
      >
        ver um exemplo
      </button>
    </div>
  );
}

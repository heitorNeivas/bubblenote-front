"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useBubbles } from "@/lib/bubbles/bubbles-context";
import { NoteEditor } from "./NoteEditor";

/** Tela 2: a nota de uma bolha — em tela cheia, estilo Notion. */
export function BubbleNoteScreen({ id }: { id: string }) {
  const { bubbles, links, hydrated, updateBubble, linkBubbles, unlink } = useBubbles();
  const bubble = bubbles.find((b) => b.id === id);

  const connected = useMemo(() => {
    if (!bubble) return [];
    return links.flatMap((l) => {
      const otherId =
        l.source === bubble.id
          ? l.target
          : l.target === bubble.id
            ? l.source
            : null;
      if (!otherId) return [];
      const other = bubbles.find((b) => b.id === otherId);
      return other ? [{ linkId: l.id, other }] : [];
    });
  }, [bubble, links, bubbles]);

  const linkable = useMemo(() => {
    if (!bubble) return [];
    const taken = new Set(connected.map((c) => c.other.id));
    return bubbles.filter((b) => b.id !== bubble.id && !taken.has(b.id));
  }, [bubble, bubbles, connected]);

  if (!hydrated) {
    return <div className="min-h-dvh" aria-hidden />;
  }

  if (!bubble) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-8 text-center">
        <h1 className="text-lg font-semibold">Bolha não encontrada</h1>
        <p className="text-sm text-text-muted">Ela pode ter sido excluída.</p>
        <Link
          href="/"
          className="rounded-md border border-border-strong px-4 py-2 text-sm transition hover:bg-bg-hover"
        >
          Voltar ao canvas
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-bg">
      <div className="sticky top-0 z-10 bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-12 w-full max-w-3xl items-center px-6 sm:px-10">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-text-muted transition hover:text-text-base"
          >
            <span aria-hidden>←</span> Canvas
          </Link>
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl px-6 pb-24 pt-8 sm:px-10">
        <input
          value={bubble.title}
          onChange={(e) => updateBubble(bubble.id, { title: e.target.value })}
          placeholder="Sem título"
          aria-label="Título da bolha"
          className="mb-6 w-full border-0 bg-transparent p-0 text-4xl font-bold tracking-tight outline-none placeholder:text-text-faint"
        />

        <NoteEditor
          value={bubble.content}
          onChange={(content) => updateBubble(bubble.id, { content })}
        />

        <section className="mt-16 border-t border-border-base pt-5">
          <h2 className="text-xs font-medium uppercase tracking-wide text-text-faint">
            Conexões
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {connected.length === 0 ? (
              <span className="text-sm text-text-muted">Nenhuma ainda.</span>
            ) : (
              connected.map(({ linkId, other }) => (
                <span
                  key={linkId}
                  className="flex items-center gap-1 rounded-full border border-border-strong bg-bg-elevated py-1 pl-3 pr-1 text-sm"
                >
                  <Link
                    href={`/bubble/${other.id}`}
                    className="transition hover:text-accent"
                  >
                    {other.title || "Sem título"}
                  </Link>
                  <button
                    type="button"
                    onClick={() => unlink(linkId)}
                    aria-label={`Desconectar de ${other.title}`}
                    className="flex h-5 w-5 items-center justify-center rounded-full text-text-faint transition hover:bg-bg-hover hover:text-(--danger)"
                  >
                    ×
                  </button>
                </span>
              ))
            )}

            {linkable.length > 0 ? (
              <label className="text-sm">
                <span className="sr-only">Conectar a outra bolha</span>
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) linkBubbles(bubble.id, e.target.value);
                  }}
                  className="rounded-full border border-dashed border-border-strong bg-transparent px-3 py-1 text-sm text-text-muted outline-none transition focus:border-accent"
                >
                  <option value="">+ conectar…</option>
                  {linkable.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title || "Sem título"}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

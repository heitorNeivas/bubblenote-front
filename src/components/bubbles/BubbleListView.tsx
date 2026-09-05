"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBubbles } from "@/lib/bubbles/bubbles-context";
import { cn } from "@/lib/utils/cn";

/** Alternativa acessível ao canvas: as bolhas como lista navegável. */
export function BubbleListView({
  onToggleView,
  onClear,
}: {
  onToggleView: () => void;
  onClear: () => void;
}) {
  const router = useRouter();
  const { bubbles, links, createBubble } = useBubbles();

  function add() {
    const b = createBubble({
      x: Math.round(Math.random() * 400 - 200),
      y: Math.round(Math.random() * 300 - 150),
    });
    router.push(`/bubble/${b.id}`);
  }

  const countFor = (id: string) =>
    links.filter((l) => l.source === id || l.target === id).length;
  const snippet = (md: string) =>
    md.replace(/[#>*_`\-\[\]!]/g, "").replace(/\s+/g, " ").trim().slice(0, 90);

  return (
    <div className="mx-auto min-h-dvh w-full max-w-2xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-base font-semibold tracking-tight">Bolhas</h1>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleView}
            aria-pressed="false"
            className="rounded-md border border-border-strong px-2.5 py-1.5 text-sm transition hover:bg-bg-hover"
          >
            Grafo
          </button>
          <button
            type="button"
            onClick={onClear}
            className="rounded-md border border-border-strong px-2.5 py-1.5 text-sm text-text-muted transition hover:bg-bg-hover"
          >
            Limpar
          </button>
          <button
            type="button"
            onClick={add}
            className="rounded-md bg-accent px-2.5 py-1.5 text-sm font-medium text-black transition hover:bg-accent-hover"
          >
            + Bolha
          </button>
        </div>
      </div>

      <ul className="flex flex-col gap-2">
        {bubbles.map((b) => {
          const n = countFor(b.id);
          return (
            <li key={b.id}>
              <Link
                href={`/bubble/${b.id}`}
                className={cn(
                  "block rounded-lg border border-border-base bg-bg-elevated px-4 py-3 transition",
                  "hover:border-accent/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                )}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-medium">{b.title || "Sem título"}</span>
                  <span className="shrink-0 text-xs text-text-faint">
                    {n === 1 ? "1 conexão" : `${n} conexões`}
                  </span>
                </div>
                {snippet(b.content) ? (
                  <p className="mt-1 line-clamp-1 text-sm text-text-muted">
                    {snippet(b.content)}
                  </p>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

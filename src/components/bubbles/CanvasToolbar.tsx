"use client";

import { cn } from "@/lib/utils/cn";

interface CanvasToolbarProps {
  zoomPct: number;
  view: "graph" | "list";
  onAdd: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onToggleView: () => void;
  onClear: () => void;
}

const btn =
  "flex h-9 min-w-9 items-center justify-center rounded-md border border-border-strong bg-bg-elevated px-2 text-sm text-text-base transition hover:bg-bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function CanvasToolbar({
  zoomPct,
  view,
  onAdd,
  onZoomIn,
  onZoomOut,
  onFit,
  onToggleView,
  onClear,
}: CanvasToolbarProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-wrap items-center justify-between gap-2 p-4">
      <div className="pointer-events-auto flex items-center gap-1 rounded-lg border border-border-base bg-bg-elevated/90 p-1 backdrop-blur">
        <button
          type="button"
          onClick={onToggleView}
          aria-pressed={view === "list"}
          className={cn(btn, "border-transparent")}
        >
          {view === "graph" ? "Lista" : "Grafo"}
        </button>
        <button
          type="button"
          onClick={onClear}
          className={cn(btn, "border-transparent text-text-muted")}
        >
          Limpar
        </button>
      </div>

      <div className="pointer-events-auto flex items-center gap-1 rounded-lg border border-border-base bg-bg-elevated/90 p-1 backdrop-blur">
        <button type="button" onClick={onZoomOut} aria-label="Diminuir zoom" className={cn(btn, "border-transparent")}>
          −
        </button>
        <button
          type="button"
          onClick={onFit}
          aria-label="Ajustar à tela"
          className={cn(btn, "border-transparent tabular-nums text-text-muted")}
        >
          {zoomPct}%
        </button>
        <button type="button" onClick={onZoomIn} aria-label="Aumentar zoom" className={cn(btn, "border-transparent")}>
          +
        </button>
        <button
          type="button"
          onClick={onAdd}
          className={cn(btn, "bg-accent font-medium text-black hover:bg-accent-hover")}
        >
          + Bolha
        </button>
      </div>
    </div>
  );
}

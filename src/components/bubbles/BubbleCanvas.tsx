"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useBubbles } from "@/lib/bubbles/bubbles-context";
import { NODE_H, NODE_W, boundingBox, type Point } from "@/lib/bubbles/geometry";
import { getViewport, saveViewport } from "@/lib/bubbles/viewport-store";
import { BubbleEdges } from "./BubbleEdges";
import { BubbleNode } from "./BubbleNode";
import { CanvasToolbar } from "./CanvasToolbar";

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 2;
const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

interface BubbleCanvasProps {
  view: "graph" | "list";
  onToggleView: () => void;
  onClear: () => void;
}

/**
 * Modelo de coordenadas: a camada "mundo" fica ancorada no CENTRO do viewport
 * (`left-1/2 top-1/2`). `pan` é o deslocamento a partir do centro (começa em
 * 0,0 = centrado). `world = (tela - centro - pan) / zoom`.
 */
export function BubbleCanvas({ view, onToggleView, onClear }: BubbleCanvasProps) {
  const router = useRouter();
  const {
    bubbles,
    links,
    justCreatedId,
    createBubble,
    updateBubble,
    removeBubble,
    linkBubbles,
    unlink,
  } = useBubbles();

  const viewportRef = useRef<HTMLDivElement>(null);
  // Restaura pan/zoom de onde o usuário parou (sobrevive a abrir/fechar a nota).
  const [pan, setPan] = useState<Point>(() => getViewport().pan);
  const [zoom, setZoom] = useState(() => getViewport().zoom);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ source: string; point: Point } | null>(null);

  /** nº de conexões por bolha (uma passada por render). */
  const countByBubble = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of links) {
      m.set(l.source, (m.get(l.source) ?? 0) + 1);
      m.set(l.target, (m.get(l.target) ?? 0) + 1);
    }
    return m;
  }, [links]);

  const live = useRef({ pan, zoom, bubbles });
  useEffect(() => {
    live.current = { pan, zoom, bubbles };
  });

  // Lembra pan/zoom para restaurar ao voltar da nota.
  useEffect(() => {
    saveViewport({ pan, zoom });
  }, [pan, zoom]);

  const panDrag = useRef<{ sx: number; sy: number; px: number; py: number } | null>(null);

  const rectOf = useCallback(
    () => viewportRef.current?.getBoundingClientRect() ?? null,
    [],
  );

  /** Ponto do viewport (px, relativo ao canto) → coordenadas de mundo. */
  const toWorld = useCallback(
    (vpX: number, vpY: number, p: Point = pan, z: number = zoom): Point => {
      const r = rectOf();
      const cx = (r?.width ?? 0) / 2;
      const cy = (r?.height ?? 0) / 2;
      return { x: (vpX - cx - p.x) / z, y: (vpY - cy - p.y) / z };
    },
    [pan, zoom, rectOf],
  );

  /* ---- pan (fundo) — só com o botão esquerdo segurado ---- */
  function onBgPointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return;
    setSelectedId(null);
    setSelectedLinkId(null);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ponteiro já inativo */
    }
    panDrag.current = { sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y };
  }
  function onBgPointerMove(e: React.PointerEvent) {
    const d = panDrag.current;
    if (!d) return;
    // Nenhum botão pressionado -> o "up" se perdeu; para de arrastar.
    if (e.buttons === 0) {
      panDrag.current = null;
      return;
    }
    setPan({ x: d.px + (e.clientX - d.sx), y: d.py + (e.clientY - d.sy) });
  }
  function endPan(e: React.PointerEvent) {
    panDrag.current = null;
    try {
      e.currentTarget?.releasePointerCapture?.(e.pointerId);
    } catch {
      /* não tinha captura */
    }
  }

  /* ---- zoom (wheel nativo p/ poder preventDefault) ---- */
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const { pan: p, zoom: z } = live.current;
      const next = clampZoom(z * (e.deltaY < 0 ? 1.1 : 0.9));
      // mantém o cursor sobre o mesmo ponto do mundo
      const r = el.getBoundingClientRect();
      const vx = e.clientX - r.left - r.width / 2;
      const vy = e.clientY - r.top - r.height / 2;
      setZoom(next);
      setPan({
        x: p.x + (vx - p.x) * (1 - next / z),
        y: p.y + (vy - p.y) * (1 - next / z),
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  /* ---- arraste de conexão ---- */
  const draftSource = draft?.source ?? null;
  useEffect(() => {
    if (!draftSource) return;
    const point = (e: PointerEvent): Point => {
      const { pan: p, zoom: z } = live.current;
      const r = rectOf();
      const cx = (r?.width ?? 0) / 2;
      const cy = (r?.height ?? 0) / 2;
      const vx = e.clientX - (r?.left ?? 0) - cx;
      const vy = e.clientY - (r?.top ?? 0) - cy;
      return { x: (vx - p.x) / z, y: (vy - p.y) / z };
    };
    const move = (e: PointerEvent) => {
      if (e.buttons === 0) {
        setDraft(null); // soltou fora da bolha -> cancela a conexão
        return;
      }
      const w = point(e);
      setDraft((d) => (d ? { ...d, point: w } : d));
    };
    const up = (e: PointerEvent) => {
      const w = point(e);
      const hit = live.current.bubbles.find(
        (b) => w.x >= b.x && w.x <= b.x + NODE_W && w.y >= b.y && w.y <= b.y + NODE_H,
      );
      // `draftSource` vem do escopo do effect (e das deps) — sem closure velha.
      // NÃO chamar linkBubbles dentro do updater do setDraft: o updater roda na
      // fase de render e dispararia um setState do BubblesProvider ali.
      if (hit && hit.id !== draftSource) linkBubbles(draftSource, hit.id);
      setDraft(null);
    };
    const cancel = () => setDraft(null);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
    };
  }, [draftSource, linkBubbles, rectOf]);

  /* ---- toolbar ---- */
  const zoomBy = useCallback((factor: number) => {
    const { pan: p, zoom: z } = live.current;
    const next = clampZoom(z * factor);
    // zoom em torno do centro do viewport (mundo em -p/z)
    setZoom(next);
    setPan({ x: (p.x / z) * next, y: (p.y / z) * next });
  }, []);

  const addBubble = useCallback(async () => {
    const center = toWorld(
      (rectOf()?.width ?? 0) / 2,
      (rectOf()?.height ?? 0) / 2,
    );
    const b = await createBubble({
      x: Math.round(center.x - NODE_W / 2 + (Math.random() * 40 - 20)),
      y: Math.round(center.y - NODE_H / 2 + (Math.random() * 40 - 20)),
    });
    setSelectedId(b.id);
  }, [createBubble, toWorld, rectOf]);

  const fit = useCallback(() => {
    const r = rectOf();
    if (!r || bubbles.length === 0) return;
    const bb = boundingBox(bubbles);
    const w = bb.maxX - bb.minX || 1;
    const h = bb.maxY - bb.minY || 1;
    const pad = 120;
    const next = clampZoom(Math.min((r.width - pad) / w, (r.height - pad) / h, 1));
    setZoom(next);
    setPan({
      x: -((bb.minX + bb.maxX) / 2) * next,
      y: -((bb.minY + bb.maxY) / 2) * next,
    });
  }, [bubbles, rectOf]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setSelectedId(null);
      setSelectedLinkId(null);
      setDraft(null);
    } else if ((e.key === "Delete" || e.key === "Backspace") && selectedLinkId) {
      e.preventDefault();
      unlink(selectedLinkId);
      setSelectedLinkId(null);
    }
  }

  return (
    <div
      ref={viewportRef}
      role="application"
      aria-label="Canvas de bolhas"
      onKeyDown={onKeyDown}
      onContextMenu={(e) => e.preventDefault()}
      className="relative h-dvh w-full overflow-hidden bg-bg"
    >
      <p className="sr-only">
        Área de grafo. Use Tab para percorrer as bolhas, Enter para abrir a nota,
        as setas para mover a bolha em foco e Delete para excluí-la. Prefere uma
        lista? Use o botão &quot;Lista&quot;.
      </p>

      {/* fundo: pan + grid + desmarcar */}
      <div
        onPointerDown={onBgPointerDown}
        onPointerMove={onBgPointerMove}
        onPointerUp={endPan}
        onPointerCancel={endPan}
        onLostPointerCapture={endPan}
        className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--border) 1px, transparent 1px)",
          backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
          backgroundPosition: `calc(50% + ${pan.x}px) calc(50% + ${pan.y}px)`,
        }}
      />

      {/* mundo (ancorado no centro) */}
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
        }}
      >
        <BubbleEdges
          bubbles={bubbles}
          links={links}
          draft={draft}
          selectedLinkId={selectedLinkId}
          onSelectLink={(id) => {
            setSelectedLinkId(id);
            setSelectedId(null);
          }}
        />
        {bubbles.map((b) => (
          <BubbleNode
            key={b.id}
            bubble={b}
            selected={b.id === selectedId}
            popping={b.id === justCreatedId}
            zoom={zoom}
            connectionCount={countByBubble.get(b.id) ?? 0}
            onSelect={() => {
              setSelectedId(b.id);
              setSelectedLinkId(null);
            }}
            onOpen={() => router.push(`/bubble/${b.id}`)}
            onMove={(x, y) => updateBubble(b.id, { x: Math.round(x), y: Math.round(y) })}
            onDelete={() => {
              removeBubble(b.id);
              setSelectedId(null);
            }}
            onConnectStart={(client) => {
              const r = rectOf();
              setDraft({
                source: b.id,
                point: toWorld(client.x - (r?.left ?? 0), client.y - (r?.top ?? 0)),
              });
            }}
          />
        ))}
      </div>

      {(selectedLinkId || selectedId) && (
        <button
          type="button"
          onClick={() => {
            if (selectedLinkId) {
              unlink(selectedLinkId);
              setSelectedLinkId(null);
            } else if (selectedId) {
              removeBubble(selectedId);
              setSelectedId(null);
            }
          }}
          className="absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-md border border-border-strong bg-bg-elevated px-3 py-1.5 text-sm text-text-base shadow-lg transition hover:border-[var(--danger)] hover:text-[var(--danger)]"
        >
          {selectedLinkId ? "Excluir conexão" : "Excluir bolha"}
        </button>
      )}

      <CanvasToolbar
        zoomPct={Math.round(zoom * 100)}
        view={view}
        onAdd={addBubble}
        onZoomIn={() => zoomBy(1.2)}
        onZoomOut={() => zoomBy(0.8)}
        onFit={fit}
        onToggleView={onToggleView}
        onClear={onClear}
      />
    </div>
  );
}

"use client";

import { useRef } from "react";
import type { Bubble } from "@/types/bubble";
import { NODE_H, NODE_W } from "@/lib/bubbles/geometry";

const DRAG_THRESHOLD = 4;
const NUDGE = 12;

/** Atraso determinístico do float a partir do id — desincroniza as bolhas. */
function floatDelay(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return -((Math.abs(h) % 900) / 100); // 0 .. -9s
}

interface BubbleNodeProps {
  bubble: Bubble;
  selected: boolean;
  popping: boolean;
  zoom: number;
  connectionCount: number;
  onSelect: () => void;
  onOpen: () => void;
  onMove: (x: number, y: number) => void;
  onDelete: () => void;
  /** Inicia o arraste de conexão (botão direito). */
  onConnectStart: (client: { x: number; y: number }) => void;
}

export function BubbleNode({
  bubble,
  selected,
  popping,
  zoom,
  connectionCount,
  onSelect,
  onOpen,
  onMove,
  onDelete,
  onConnectStart,
}: BubbleNodeProps) {
  const drag = useRef<{
    sx: number;
    sy: number;
    ox: number;
    oy: number;
    moved: boolean;
  } | null>(null);

  function onPointerDown(e: React.PointerEvent) {
    e.stopPropagation();

    // Botão direito = puxar conexão (o canvas trata o arraste via window).
    if (e.button === 2) {
      e.preventDefault();
      onSelect();
      onConnectStart({ x: e.clientX, y: e.clientY });
      return;
    }

    // Só o botão esquerdo move / seleciona.
    if (e.button !== 0) return;
    onSelect();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ponteiro já inativo */
    }
    drag.current = {
      sx: e.clientX,
      sy: e.clientY,
      ox: bubble.x,
      oy: bubble.y,
      moved: false,
    };
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    // Nenhum botão pressionado -> o "up" se perdeu; encerra o arraste.
    if (e.buttons === 0) {
      drag.current = null;
      return;
    }
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    if (!d.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    d.moved = true;
    onMove(d.ox + dx / zoom, d.oy + dy / zoom);
  }

  function endDrag(e: React.PointerEvent) {
    drag.current = null;
    try {
      e.currentTarget?.releasePointerCapture?.(e.pointerId);
    } catch {
      /* não tinha captura */
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const moves: Record<string, [number, number]> = {
      ArrowUp: [0, -NUDGE],
      ArrowDown: [0, NUDGE],
      ArrowLeft: [-NUDGE, 0],
      ArrowRight: [NUDGE, 0],
    };
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen();
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      onDelete();
    } else if (moves[e.key]) {
      e.preventDefault();
      const [dx, dy] = moves[e.key];
      onMove(bubble.x + dx, bubble.y + dy);
    }
  }

  return (
    <div
      data-bubble
      className="absolute"
      style={{
        left: bubble.x,
        top: bubble.y,
        width: NODE_W,
        height: NODE_H,
        animation: popping ? "bubble-pop 420ms ease-out" : undefined,
      }}
    >
      <div
        data-bubble
        role="button"
        tabIndex={0}
        aria-label={`Bolha: ${bubble.title || "sem título"}`}
        aria-describedby={`bubble-${bubble.id}-meta`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
        onDoubleClick={onOpen}
        onContextMenu={(e) => e.preventDefault()}
        onKeyDown={onKeyDown}
        onFocus={onSelect}
        className="flex h-full w-full select-none items-center justify-center px-4 text-center text-[13px] font-semibold leading-tight outline-none will-change-transform"
        style={{
          borderRadius: "9999px",
          background: "var(--bubble-bg)",
          color: "var(--bubble-text)",
          border: `2px solid ${
            selected ? "var(--bubble-ring)" : "rgba(52,198,217,0.5)"
          }`,
          boxShadow: selected ? "0 0 0 5px rgba(52,198,217,0.35)" : "none",
          transition: "box-shadow 150ms ease",
          cursor: "grab",
          animation: "bubble-float 8.5s ease-in-out infinite",
          animationDelay: `${floatDelay(bubble.id)}s`,
        }}
      >
        <span className="line-clamp-3">{bubble.title || "Sem título"}</span>
      </div>

      <span id={`bubble-${bubble.id}-meta`} className="sr-only">
        {connectionCount === 1 ? "1 conexão" : `${connectionCount} conexões`}.
        Enter (ou duplo clique) abre a nota, setas movem, Delete exclui.
        Botão direito arrastando conecta a outra bolha.
      </span>
    </div>
  );
}

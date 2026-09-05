"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Bubble, BubbleLink } from "@/types/bubble";
import {
  bubbleCenter,
  edgePath,
  edgePathAnimated,
  hashPhase,
  type Point,
} from "@/lib/bubbles/geometry";

interface BubbleEdgesProps {
  bubbles: Bubble[];
  links: BubbleLink[];
  draft: { source: string; point: Point } | null;
  selectedLinkId: string | null;
  onSelectLink: (id: string) => void;
}

/** `var()` não vale em atributos SVG — só em `style`. */
const lineStyle = (selected: boolean): React.CSSProperties => ({
  stroke: "var(--accent)",
  strokeWidth: selected ? 3 : 2,
  strokeDasharray: "1 8",
  strokeLinecap: "round",
  fill: "none",
  opacity: selected ? 1 : 0.85,
  animation: "edge-dash-flow 4.5s linear infinite",
});

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/** Camada SVG das conexões — pontilhado ciano que ondula devagar. Decorativa. */
export function BubbleEdges({
  bubbles,
  links,
  draft,
  selectedLinkId,
  onSelectLink,
}: BubbleEdgesProps) {
  const byId = useMemo(() => new Map(bubbles.map((b) => [b.id, b])), [bubbles]);
  const reduced = usePrefersReducedMotion();

  // Relógio de animação (~24fps) só quando há o que animar.
  const [t, setT] = useState(0);
  const animating = !reduced && (links.length > 0 || draft !== null);
  useEffect(() => {
    if (!animating) return;
    let raf = 0;
    let last = 0;
    const loop = (now: number) => {
      if (now - last > 40) {
        last = now;
        setT(now);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [animating]);

  const paths = useMemo(
    () =>
      links.flatMap((link) => {
        const a = byId.get(link.source);
        const b = byId.get(link.target);
        if (!a || !b) return [];
        const ca = bubbleCenter(a);
        const cb = bubbleCenter(b);
        const d = reduced
          ? edgePath(ca, cb)
          : edgePathAnimated(ca, cb, hashPhase(link.id), t);
        return [{ id: link.id, d }];
      }),
    [links, byId, reduced, t],
  );

  const draftD = useMemo(() => {
    if (!draft) return null;
    const src = byId.get(draft.source);
    if (!src) return null;
    const ca = bubbleCenter(src);
    return reduced
      ? edgePath(ca, draft.point)
      : edgePathAnimated(ca, draft.point, hashPhase(draft.source), t);
  }, [draft, byId, reduced, t]);

  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute left-0 top-0 overflow-visible"
      width={1}
      height={1}
    >
      {paths.map(({ id, d }) => {
        const selected = id === selectedLinkId;
        return (
          <g key={id} className="pointer-events-auto">
            {/* área de clique */}
            <path
              d={d}
              fill="none"
              stroke="transparent"
              strokeWidth={18}
              style={{ cursor: "pointer" }}
              onPointerDown={(e) => {
                e.stopPropagation();
                onSelectLink(id);
              }}
            />
            <path data-edge d={d} style={lineStyle(selected)} />
          </g>
        );
      })}

      {draftD ? <path data-edge d={draftD} style={lineStyle(false)} /> : null}
    </svg>
  );
}

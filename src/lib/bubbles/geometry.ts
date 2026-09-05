import type { Bubble } from "@/types/bubble";

/** Dimensões da bolha (px, em coordenadas de mundo). Redonda: W === H. */
export const NODE_W = 132;
export const NODE_H = 132;

export interface Point {
  x: number;
  y: number;
}

export function bubbleCenter(b: Pick<Bubble, "x" | "y">): Point {
  return { x: b.x + NODE_W / 2, y: b.y + NODE_H / 2 };
}

/** Caminho SVG (cúbico) reto-ish entre dois pontos. */
export function edgePath(a: Point, b: Point): string {
  const dx = Math.abs(b.x - a.x);
  const c = Math.max(40, dx * 0.4);
  return `M ${a.x} ${a.y} C ${a.x + c} ${a.y}, ${b.x - c} ${b.y}, ${b.x} ${b.y}`;
}

/** Hash simples de string -> número (fase estável por link). */
export function hashPhase(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (Math.abs(h) % 628) / 100; // 0 .. ~2π
}

/**
 * Caminho da conexão com uma ondulação lenta no tempo — a linha "respira"
 * como um fio solto em vez de um arco rígido. `t` em ms.
 */
export function edgePathAnimated(
  a: Point,
  b: Point,
  phase: number,
  t: number,
): string {
  const mx = b.x - a.x;
  const my = b.y - a.y;
  const len = Math.hypot(mx, my) || 1;
  // normal unitária
  const nx = -my / len;
  const ny = mx / len;
  // amplitude proporcional ao comprimento, mas limitada
  const amp = Math.min(len * 0.08, 16);
  // dois "empurrões" em velocidades/fases diferentes -> ondula, não arqueia
  const s1 = Math.sin(t * 0.0011 + phase) * amp;
  const s2 = Math.sin(t * 0.00071 + phase * 1.7 + 2.1) * amp;

  const c1x = a.x + mx / 3 + nx * s1;
  const c1y = a.y + my / 3 + ny * s1;
  const c2x = a.x + (mx * 2) / 3 + nx * s2;
  const c2y = a.y + (my * 2) / 3 + ny * s2;

  return `M ${a.x} ${a.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${b.x} ${b.y}`;
}

/** Converte um ponto da tela (relativo ao viewport) para coordenadas de mundo. */
export function screenToWorld(
  screen: Point,
  pan: Point,
  zoom: number,
): Point {
  return { x: (screen.x - pan.x) / zoom, y: (screen.y - pan.y) / zoom };
}

/** Retângulo que contém todas as bolhas (para "ajustar à tela"). */
export function boundingBox(bubbles: Bubble[]) {
  if (bubbles.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const b of bubbles) {
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + NODE_W);
    maxY = Math.max(maxY, b.y + NODE_H);
  }
  return { minX, minY, maxX, maxY };
}

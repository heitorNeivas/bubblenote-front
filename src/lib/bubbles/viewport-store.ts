import type { Point } from "./geometry";

/**
 * Guarda pan/zoom do canvas fora do React para sobreviver à navegação
 * (abrir a nota e voltar). É estado efêmero de UI — zera no reload da página,
 * o que é aceitável. Não vai para o localStorage.
 */

export interface Viewport {
  pan: Point;
  zoom: number;
}

let current: Viewport = { pan: { x: 0, y: 0 }, zoom: 1 };

export function getViewport(): Viewport {
  return current;
}

export function saveViewport(v: Viewport): void {
  current = v;
}

/**
 * "Bolhas": grafo de notas em Markdown que se interligam.
 * Modelo local por enquanto — o backend preenche a mesma forma depois.
 */

export interface Bubble {
  id: string;
  title: string;
  /** Conteúdo bruto em Markdown — renderizado por `MarkdownViewer`. */
  content: string;
  /** Posição no canvas (coordenadas de "mundo", antes de pan/zoom). */
  x: number;
  y: number;
}

export interface BubbleLink {
  id: string;
  source: string;
  target: string;
}

export interface BubblesState {
  bubbles: Bubble[];
  links: BubbleLink[];
}

export interface CreateBubbleInput {
  title?: string;
  content?: string;
  x?: number;
  y?: number;
}

export type UpdateBubbleInput = Partial<
  Pick<Bubble, "title" | "content" | "x" | "y">
>;

import type { BubblesState } from "@/types/bubble";

/** Grafo de exemplo — só para visualizar o canvas sem montar tudo à mão. */
export function exampleState(): BubblesState {
  const b = (id: string, title: string, content: string, x: number, y: number) => ({
    id,
    title,
    content,
    x,
    y,
  });

  return {
    bubbles: [
      b("ex-1", "Ideias", "# Ideias\n\nO ponto de partida de tudo.\n\n- [[Pesquisa]]\n- [[Rascunhos]]", 0, 0),
      b("ex-2", "Pesquisa", "## Pesquisa\n\nLinks e referências que sustentam as ideias.", 320, -140),
      b("ex-3", "Rascunhos", "## Rascunhos\n\nTexto solto, ainda sem forma.", 300, 160),
      b("ex-4", "Publicado", "## Publicado\n\nO que já saiu do forno.", 600, 40),
    ],
    links: [
      { id: "ex-l1", source: "ex-1", target: "ex-2" },
      { id: "ex-l2", source: "ex-1", target: "ex-3" },
      { id: "ex-l3", source: "ex-3", target: "ex-4" },
      { id: "ex-l4", source: "ex-2", target: "ex-4" },
    ],
  };
}

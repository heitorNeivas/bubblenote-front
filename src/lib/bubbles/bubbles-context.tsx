"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  Bubble,
  BubbleLink,
  BubblesState,
  CreateBubbleInput,
  UpdateBubbleInput,
} from "@/types/bubble";
import type { ApiResource, LaravelPaginated } from "@/types/api";
import type { Note } from "@/types/note";
import { browserApi } from "@/lib/http/browser";
import { toUserMessage } from "@/lib/http/api-error";
import { useSession } from "@/lib/auth/session-context";
import { useToast } from "@/components/feedback/toast";
import { exampleState } from "./example";

/**
 * Estado das bolhas — a fonte de verdade é a API (`/api/notes`), escopada
 * pelo usuário autenticado (sessão/token, ver `browserApi`). O fetch é
 * refeito sempre que o usuário logado muda (login, logout, troca de conta),
 * o que garante que uma conta nunca continue mostrando bolhas que ficaram em
 * memória de outra conta usada antes no mesmo navegador.
 */

const EMPTY: BubblesState = { bubbles: [], links: [] };
const POP_MS = 550;
/** Grande o bastante pra trazer "todas" as notas do usuário numa página só. */
const PER_PAGE = 1000;

interface BubblesContextValue extends BubblesState {
  /** `false` até o fetch inicial na API resolver. */
  hydrated: boolean;
  /** Mensagem da última falha de rede/validação (null = sem erro pendente). */
  error: string | null;
  /** id da bolha recém-criada (para a animação de aparição); some sozinho. */
  justCreatedId: string | null;
  /** Resolve com a bolha criada, ou `null` se a API falhou (erro já exibido). */
  createBubble: (input?: CreateBubbleInput) => Promise<Bubble | null>;
  updateBubble: (id: string, patch: UpdateBubbleInput) => void;
  removeBubble: (id: string) => void;
  linkBubbles: (source: string, target: string) => void;
  unlink: (linkId: string) => void;
  reset: () => void;
  loadExample: () => void;
}

const BubblesContext = createContext<BubblesContextValue | null>(null);

function makeLinkId(source: string, target: string): string {
  return `${source}-${target}`;
}

/** `Note` (backend) -> `Bubble` (canvas). Posição vem de `properties.{x,y}`. */
function noteToBubble(note: Note): Bubble {
  const props = note.properties ?? {};
  return {
    id: String(note.id),
    title: note.title,
    content: note.body_markdown ?? "",
    x: typeof props.x === "number" ? props.x : 0,
    y: typeof props.y === "number" ? props.y : 0,
  };
}

/** Reconstrói as arestas a partir do `linked_notes` (saída) de cada nota. */
function notesToLinks(notes: Note[]): BubbleLink[] {
  const links: BubbleLink[] = [];
  for (const note of notes) {
    const source = String(note.id);
    for (const target of note.linked_notes ?? []) {
      const targetId = String(target.id);
      links.push({ id: makeLinkId(source, targetId), source, target: targetId });
    }
  }
  return links;
}

/** Ids (numéricos) das notas para as quais `sourceId` já linka. */
function outgoingIds(links: BubbleLink[], sourceId: string): number[] {
  return links.filter((l) => l.source === sourceId).map((l) => Number(l.target));
}

export function BubblesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useSession();
  const toast = useToast();
  const [state, setState] = useState<BubblesState>(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justCreatedId, setJustCreatedId] = useState<string | null>(null);

  // timers ativos, limpos no unmount
  const timers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  useEffect(() => {
    const set = timers.current;
    return () => {
      set.forEach(clearTimeout);
      set.clear();
    };
  }, []);

  // Busca as notas do usuário logado sempre que a sessão muda. É isso (e não
  // o ciclo de vida do provider) que impede uma conta de herdar dados de
  // outra conta usada antes no mesmo navegador.
  useEffect(() => {
    let cancelled = false;

    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- logout: limpa o board sem esperar rede.
      setState(EMPTY);
      setHydrated(true);
      return;
    }

    setHydrated(false);
    browserApi
      .get<LaravelPaginated<Note>>("notes", { query: { per_page: PER_PAGE } })
      .then(({ data: notes }) => {
        if (cancelled) return;
        setState({ bubbles: notes.map(noteToBubble), links: notesToLinks(notes) });
      })
      .catch((cause) => {
        if (cancelled) return;
        setState(EMPTY);
        setError(toUserMessage(cause));
        toast.error(cause);
      })
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });

    return () => {
      cancelled = true;
    };
    // Só re-executa quando o usuário muda de fato (id) — não a cada refresh()
    // que crie um novo objeto `user` com o mesmo id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const createBubble = useCallback(
    async (input: CreateBubbleInput = {}): Promise<Bubble | null> => {
      const x = input.x ?? 0;
      const y = input.y ?? 0;

      let note: Note;
      try {
        // `title` é obrigatório e não-vazio no backend (StoreNoteRequest).
        ({ data: note } = await browserApi.post<ApiResource<Note>>("notes", {
          title: input.title?.trim() || "Nota sem título",
          body_markdown: input.content ?? "",
          properties: { x, y },
        }));
      } catch (cause) {
        setError(toUserMessage(cause));
        toast.error(cause);
        return null;
      }

      const bubble = noteToBubble(note);

      setState((s) => ({ ...s, bubbles: [...s.bubbles, bubble] }));

      setJustCreatedId(bubble.id);
      const t = setTimeout(() => {
        timers.current.delete(t);
        setJustCreatedId((id) => (id === bubble.id ? null : id));
      }, POP_MS);
      timers.current.add(t);

      return bubble;
    },
    [toast],
  );

  const updateBubble = useCallback((id: string, patch: UpdateBubbleInput) => {
    setState((s) => ({
      ...s,
      bubbles: s.bubbles.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }));

    const { title, content, x, y } = patch;
    browserApi
      .patch(`notes/${id}`, {
        ...(title !== undefined ? { title } : {}),
        ...(content !== undefined ? { body_markdown: content } : {}),
        ...(x !== undefined || y !== undefined ? { properties: { x, y } } : {}),
      })
      .catch((cause) => {
        setError(toUserMessage(cause));
        toast.error(cause);
      });
  }, [toast]);

  const removeBubble = useCallback((id: string) => {
    setState((s) => ({
      bubbles: s.bubbles.filter((b) => b.id !== id),
      links: s.links.filter((l) => l.source !== id && l.target !== id),
    }));

    browserApi
      .delete(`notes/${id}`)
      .catch((cause) => {
        setError(toUserMessage(cause));
        toast.error(cause);
      });
  }, [toast]);

  const linkBubbles = useCallback((source: string, target: string) => {
    if (source === target) return;

    setState((s) => {
      const exists = s.links.some(
        (l) =>
          (l.source === source && l.target === target) ||
          (l.source === target && l.target === source),
      );
      if (exists) return s;

      const nextLinks = [...s.links, { id: makeLinkId(source, target), source, target }];

      // O backend faz `sync()`: precisa da lista completa de saída, não só do novo id.
      browserApi
        .patch(`notes/${source}`, { linked_note_ids: outgoingIds(nextLinks, source) })
        .catch((cause) => {
          setError(toUserMessage(cause));
          toast.error(cause);
        });

      return { ...s, links: nextLinks };
    });
  }, [toast]);

  const unlink = useCallback((linkIdToRemove: string) => {
    setState((s) => {
      const link = s.links.find((l) => l.id === linkIdToRemove);
      if (!link) return s;

      const nextLinks = s.links.filter((l) => l.id !== linkIdToRemove);

      browserApi
        .patch(`notes/${link.source}`, {
          linked_note_ids: outgoingIds(nextLinks, link.source),
        })
        .catch((cause) => {
          setError(toUserMessage(cause));
          toast.error(cause);
        });

      return { ...s, links: nextLinks };
    });
  }, [toast]);

  const reset = useCallback(() => {
    setState((s) => {
      Promise.all(s.bubbles.map((b) => browserApi.delete(`notes/${b.id}`))).catch(
        (cause) => {
          setError(toUserMessage(cause));
          toast.error(cause);
        },
      );
      return EMPTY;
    });
  }, [toast]);

  const loadExample = useCallback(() => {
    void (async () => {
      try {
        const example = exampleState();
        // Ids do exemplo são fixos; os reais só existem depois do POST.
        const idMap = new Map<string, string>();

        for (const b of example.bubbles) {
          const created = await createBubble({
            title: b.title,
            content: b.content,
            x: b.x,
            y: b.y,
          });
          // Falhou a criação (erro já exibido pelo toast): aborta o exemplo.
          if (!created) return;
          idMap.set(b.id, created.id);
        }

        for (const l of example.links) {
          const source = idMap.get(l.source);
          const target = idMap.get(l.target);
          if (source && target) linkBubbles(source, target);
        }
      } catch (cause) {
        setError(toUserMessage(cause));
        toast.error(cause);
      }
    })();
  }, [createBubble, linkBubbles, toast]);

  const value = useMemo<BubblesContextValue>(
    () => ({
      ...state,
      hydrated,
      error,
      justCreatedId,
      createBubble,
      updateBubble,
      removeBubble,
      linkBubbles,
      unlink,
      reset,
      loadExample,
    }),
    [
      state,
      hydrated,
      error,
      justCreatedId,
      createBubble,
      updateBubble,
      removeBubble,
      linkBubbles,
      unlink,
      reset,
      loadExample,
    ],
  );

  return <BubblesContext.Provider value={value}>{children}</BubblesContext.Provider>;
}

export function useBubbles(): BubblesContextValue {
  const ctx = useContext(BubblesContext);
  if (!ctx) throw new Error("useBubbles deve ser usado dentro de <BubblesProvider>");
  return ctx;
}

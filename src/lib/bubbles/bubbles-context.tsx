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
import { exampleState } from "./example";

/**
 * Estado das bolhas — local, persistido em `localStorage`.
 *
 * É o ponto único de dados: quando o backend entrar, é aqui que as ações
 * viram chamadas HTTP (a forma exposta pelo hook não muda).
 *
 * NOTA (decisões de domínio pendentes de backend):
 *  - `linkBubbles` hoje evita auto-liga e duplicata A–B/B–A.
 *  - `removeBubble` hoje apaga em cascata os links da bolha.
 *  Quando o backend existir, essas regras devem vir de lá.
 */

const STORAGE_KEY = "granito.bubbles.v1";
const EMPTY: BubblesState = { bubbles: [], links: [] };
const POP_MS = 550;

interface BubblesContextValue extends BubblesState {
  /** `false` até hidratar do localStorage (evita mismatch no SSR). */
  hydrated: boolean;
  /** id da bolha recém-criada (para a animação de aparição); some sozinho. */
  justCreatedId: string | null;
  createBubble: (input?: CreateBubbleInput) => Bubble;
  updateBubble: (id: string, patch: UpdateBubbleInput) => void;
  removeBubble: (id: string) => void;
  linkBubbles: (source: string, target: string) => void;
  unlink: (linkId: string) => void;
  reset: () => void;
  loadExample: () => void;
}

const BubblesContext = createContext<BubblesContextValue | null>(null);

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `b_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Normaliza um registro cru do localStorage para o tipo `Bubble`. */
function coerceBubble(raw: unknown): Bubble | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "string") return null;
  return {
    id: r.id,
    title: typeof r.title === "string" ? r.title : "",
    content: typeof r.content === "string" ? r.content : "",
    x: Number.isFinite(r.x) ? (r.x as number) : 0,
    y: Number.isFinite(r.y) ? (r.y as number) : 0,
  };
}

function coerceLink(raw: unknown): BubbleLink | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (
    typeof r.id !== "string" ||
    typeof r.source !== "string" ||
    typeof r.target !== "string"
  ) {
    return null;
  }
  return { id: r.id, source: r.source, target: r.target };
}

/** Lê e sanea o estado persistido; descarta links órfãos. */
function readStorage(): BubblesState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!Array.isArray(parsed.bubbles) || !Array.isArray(parsed.links)) return null;

    const bubbles = parsed.bubbles
      .map(coerceBubble)
      .filter((b): b is Bubble => b !== null);
    const ids = new Set(bubbles.map((b) => b.id));
    const links = parsed.links
      .map(coerceLink)
      .filter(
        (l): l is BubbleLink =>
          l !== null && ids.has(l.source) && ids.has(l.target),
      );

    return { bubbles, links };
  } catch {
    return null;
  }
}

export function BubblesProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<BubblesState>(EMPTY);
  const [hydrated, setHydrated] = useState(false);
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

  useEffect(() => {
    // Hidratação de mount: ler o localStorage aqui (e não num initializer de
    // useState) evita mismatch de SSR.
    const stored = readStorage();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored) setState(stored);
    setHydrated(true);
  }, []);

  // Persistência com debounce — não trava o arraste.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!hydrated) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        /* storage cheio / indisponível — segue sem persistir */
      }
    }, 300);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [state, hydrated]);

  const createBubble = useCallback((input: CreateBubbleInput = {}): Bubble => {
    const bubble: Bubble = {
      id: newId(),
      title: input.title?.trim() || "",
      content: input.content ?? "",
      x: input.x ?? 0,
      y: input.y ?? 0,
    };
    setState((s) => ({ ...s, bubbles: [...s.bubbles, bubble] }));

    setJustCreatedId(bubble.id);
    const t = setTimeout(() => {
      timers.current.delete(t);
      setJustCreatedId((id) => (id === bubble.id ? null : id));
    }, POP_MS);
    timers.current.add(t);

    return bubble;
  }, []);

  const updateBubble = useCallback((id: string, patch: UpdateBubbleInput) => {
    setState((s) => ({
      ...s,
      bubbles: s.bubbles.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }));
  }, []);

  const removeBubble = useCallback((id: string) => {
    setState((s) => ({
      bubbles: s.bubbles.filter((b) => b.id !== id),
      links: s.links.filter((l) => l.source !== id && l.target !== id),
    }));
  }, []);

  const linkBubbles = useCallback((source: string, target: string) => {
    if (source === target) return;
    setState((s) => {
      const exists = s.links.some(
        (l) =>
          (l.source === source && l.target === target) ||
          (l.source === target && l.target === source),
      );
      if (exists) return s;
      const link: BubbleLink = { id: newId(), source, target };
      return { ...s, links: [...s.links, link] };
    });
  }, []);

  const unlink = useCallback((linkId: string) => {
    setState((s) => ({ ...s, links: s.links.filter((l) => l.id !== linkId) }));
  }, []);

  const reset = useCallback(() => setState(EMPTY), []);
  const loadExample = useCallback(() => setState(exampleState()), []);

  const value = useMemo<BubblesContextValue>(
    () => ({
      ...state,
      hydrated,
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

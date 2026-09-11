/**
 * Domínio de conhecimento: notas em Markdown, isoladas por usuário.
 * Espelha exatamente o `NoteResource` / `Store|UpdateNoteRequest` do Laravel
 * (`app/Http/Resources/NoteResource.php`, `app/Http/Requests/*NoteRequest.php`).
 */

export interface Tag {
  id: number;
  name: string;
}

/** Frontmatter estruturado — objeto livre; o canvas guarda a posição aqui. */
export interface NoteProperties {
  x?: number;
  y?: number;
  [key: string]: unknown;
}

/** Nota completa, como devolvida por `NoteResource`. */
export interface Note {
  id: number;
  title: string;
  body_markdown: string | null;
  properties: NoteProperties;
  created_at: string | null;
  updated_at: string | null;
  /** Só vêm preenchidos quando o backend fez eager load (`whenLoaded`). */
  tags?: Tag[];
  linked_notes?: Note[];
  backlinks?: Note[];
}

/** Corpo aceito por `POST /api/notes` (`StoreNoteRequest`). */
export interface CreateNoteInput {
  title: string;
  body_markdown?: string | null;
  properties?: NoteProperties;
  tags?: string[];
  linked_note_ids?: number[];
}

/** Corpo aceito por `PATCH/PUT /api/notes/{note}` — tudo opcional. */
export type UpdateNoteInput = Partial<CreateNoteInput>;

/**
 * Domínio de conhecimento: pastas e notas em Markdown.
 * Espelha o que a API Laravel deve expor; ajuste os campos conforme o backend.
 */

export interface Folder {
  id: number | string;
  name: string;
  parent_id: number | string | null;
  created_at: string;
  updated_at: string;
}

/** Nota completa, com o corpo Markdown. */
export interface Note {
  id: number | string;
  title: string;
  /** Conteúdo bruto em Markdown — renderizado por `react-markdown`. */
  content: string;
  folder_id: number | string | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

/** Versão leve para listagens na Sidebar (sem o corpo). */
export type NoteSummary = Pick<
  Note,
  "id" | "title" | "folder_id" | "is_pinned" | "updated_at"
>;

/** Árvore montada no client a partir de pastas + notas. */
export interface TreeNode {
  folder: Folder;
  folders: TreeNode[];
  notes: NoteSummary[];
}

export interface CreateNoteInput {
  title: string;
  content?: string;
  folder_id?: number | string | null;
}

export type UpdateNoteInput = Partial<CreateNoteInput> & {
  is_pinned?: boolean;
};

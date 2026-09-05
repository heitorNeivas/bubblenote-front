"use client";

import { useState } from "react";
import { useBubbles } from "@/lib/bubbles/bubbles-context";
import { EmptyState } from "./EmptyState";
import { BubbleCanvas } from "./BubbleCanvas";
import { BubbleListView } from "./BubbleListView";
import { WorkspaceTopBar } from "./WorkspaceTopBar";

/** Corpo da rota `/` — canvas de bolhas ou o convite inicial. */
export function Workspace() {
  const { bubbles, hydrated, reset } = useBubbles();
  const [view, setView] = useState<"graph" | "list">("graph");

  const toggleView = () => setView((v) => (v === "graph" ? "list" : "graph"));

  function clear() {
    if (window.confirm("Apagar todas as bolhas e conexões?")) reset();
  }

  // Enquanto hidrata o localStorage, evita piscar o empty state.
  if (!hydrated) {
    return <div className="min-h-dvh" aria-hidden />;
  }

  if (bubbles.length === 0) {
    return (
      <div className="fixed inset-0">
        <WorkspaceTopBar />
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden">
      <WorkspaceTopBar />
      {view === "graph" ? (
        <BubbleCanvas view={view} onToggleView={toggleView} onClear={clear} />
      ) : (
        <div className="h-dvh overflow-auto">
          <BubbleListView onToggleView={toggleView} onClear={clear} />
        </div>
      )}
    </div>
  );
}

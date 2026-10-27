"use client";

import { useEffect, useRef, useState } from "react";
import { X, Trash2, AlertTriangle, Download } from "lucide-react";
import type { Note } from "@/lib/types";

interface Props {
  notes: Note[];
  onDeleteAll: () => void;
  onClose: () => void;
}

export default function SettingsModal({ notes, onDeleteAll, onClose }: Props) {
  const noteCount = notes.length;
  const [confirming, setConfirming] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (confirming) setConfirming(false);
        else onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [confirming, onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleExport = () => {
    const data = { app: "datnotes", version: 1, exportedAt: new Date().toISOString(), notes };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `datnotes-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const handleDeleteAll = () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    onDeleteAll();
    onClose();
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-(--dt-overlay) backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div className="relative w-full max-w-sm rounded-xl border border-(--dt-border) bg-(--dt-popover) p-6 shadow-(--dt-shadow-lg)">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded text-(--dt-subtle-foreground) transition-colors hover:text-(--dt-muted-foreground)"
        >
          <X size={14} strokeWidth={2} />
        </button>

        {/* Header */}
        <div className="mb-6">
          <p className="text-sm font-semibold text-(--dt-foreground)">datnotes</p>
          <p className="mt-2 text-xs text-(--dt-subtle-foreground)">
            A minimal, client-side note-taking app.
            <br />
            All notes are stored locally in your browser.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-6 rounded-lg border border-(--dt-border) bg-(--dt-input) px-4 py-3">
          <div className="flex justify-between text-xs">
            <span className="text-(--dt-subtle-foreground)">Notes stored</span>
            <span className="font-medium text-(--dt-muted-foreground)">{noteCount}</span>
          </div>
          <div className="mt-2 flex justify-between text-xs">
            <span className="text-(--dt-subtle-foreground)">Storage</span>
            <span className="font-medium text-(--dt-muted-foreground)">localStorage</span>
          </div>
        </div>

        {/* Export */}
        <div className="mb-6 rounded-lg border border-(--dt-border) bg-(--dt-input) p-4">
          <p className="mb-1 text-xs font-medium text-(--dt-subtle-foreground)">Export</p>
          <p className="mb-3 text-[11px] text-(--dt-icon-tertiary)">
            Download all notes as a JSON file to back them up or move them elsewhere.
          </p>
          <button
            onClick={handleExport}
            disabled={noteCount === 0}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-(--dt-border) px-3 py-2 text-xs font-medium text-(--dt-muted-foreground) transition-colors hover:border-(--dt-input-border) hover:bg-(--dt-accent) hover:text-(--dt-foreground) disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Download size={12} strokeWidth={2} />
            Export notes as JSON
          </button>
        </div>

        {/* Danger zone */}
        <div className="rounded-lg border border-(--dt-border) bg-(--dt-background-tertiary) p-4">
          <p className="mb-3 text-xs font-medium text-(--dt-subtle-foreground)">Danger zone</p>

          {!confirming ? (
            <button
              onClick={handleDeleteAll}
              disabled={noteCount === 0}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-(--dt-input-border) px-3 py-2 text-xs font-medium text-(--dt-destructive) transition-colors hover:bg-(--dt-accent) disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Trash2 size={12} strokeWidth={2} />
              Delete all notes
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-md border border-(--dt-input-border) bg-(--dt-muted) p-3">
                <AlertTriangle size={13} className="mt-0.5 flex-shrink-0 text-(--dt-destructive)" />
                <p className="text-xs text-(--dt-secondary-foreground)">
                  This will permanently delete all {noteCount} note
                  {noteCount !== 1 ? "s" : ""}. This cannot be undone.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirming(false)}
                  className="flex-1 rounded-md border border-(--dt-border) px-3 py-2 text-xs font-medium text-(--dt-subtle-foreground) transition-colors hover:border-(--dt-input-border) hover:text-(--dt-muted-foreground)"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAll}
                  className="flex-1 rounded-md bg-(--dt-destructive) px-3 py-2 text-xs font-medium text-(--dt-destructive-foreground) transition-colors hover:bg-(--dt-destructive-hover)"
                >
                  Delete all
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-[10px] text-(--dt-icon-tertiary)">
          datnotes · version 1.0.0
        </p>
      </div>
    </div>
  );
}

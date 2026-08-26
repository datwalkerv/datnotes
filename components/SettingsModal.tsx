"use client";

import { useEffect, useRef, useState } from "react";
import { X, Trash2, AlertTriangle } from "lucide-react";

interface Props {
  noteCount: number;
  onDeleteAll: () => void;
  onClose: () => void;
}

export default function SettingsModal({ noteCount, onDeleteAll, onClose }: Props) {
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div className="relative w-full max-w-sm rounded-xl border border-[#222] bg-[#111] p-6 shadow-2xl">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded text-[#555] transition-colors hover:text-[#999]"
        >
          <X size={14} strokeWidth={2} />
        </button>

        {/* Header */}
        <div className="mb-6">
          <p className="text-sm font-semibold text-[#e8e8e8]">datnotes</p>
          <p className="mt-2 text-xs text-[#555]">
            A minimal, client-side note-taking app.
            <br />
            All notes are stored locally in your browser.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-6 rounded-lg border border-[#1e1e1e] bg-[#0d0d0d] px-4 py-3">
          <div className="flex justify-between text-xs">
            <span className="text-[#555]">Notes stored</span>
            <span className="font-medium text-[#999]">{noteCount}</span>
          </div>
          <div className="mt-2 flex justify-between text-xs">
            <span className="text-[#555]">Storage</span>
            <span className="font-medium text-[#999]">localStorage</span>
          </div>
        </div>

        {/* Danger zone */}
        <div className="rounded-lg border border-[#2a1515] bg-[#0d0a0a] p-4">
          <p className="mb-3 text-xs font-medium text-[#666]">Danger zone</p>

          {!confirming ? (
            <button
              onClick={handleDeleteAll}
              disabled={noteCount === 0}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-[#3a1515] px-3 py-2 text-xs font-medium text-red-500 transition-colors hover:bg-[#1a0a0a] disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Trash2 size={12} strokeWidth={2} />
              Delete all notes
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-md border border-[#3a1515] bg-[#150a0a] p-3">
                <AlertTriangle size={13} className="mt-0.5 flex-shrink-0 text-red-500" />
                <p className="text-xs text-[#bbb]">
                  This will permanently delete all {noteCount} note
                  {noteCount !== 1 ? "s" : ""}. This cannot be undone.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirming(false)}
                  className="flex-1 rounded-md border border-[#222] px-3 py-2 text-xs font-medium text-[#666] transition-colors hover:border-[#333] hover:text-[#999]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAll}
                  className="flex-1 rounded-md bg-red-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-red-700"
                >
                  Delete all
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-[10px] text-[#333]">
          datnotes · version 1.0.0
        </p>
      </div>
    </div>
  );
}

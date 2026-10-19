"use client";

import { Plus, Settings, Share2, Users, X } from "lucide-react";
import { useRef, useState } from "react";
import type { Note } from "@/lib/types";
import { getTitle } from "@/lib/utils";

interface Props {
  notes: Note[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onOpenSettings: () => void;
  onOpenShare: () => void;
  canShare: boolean;
  onOpenContrib: () => void;
  canContrib: boolean;
  isContrib: boolean;
}

export default function TopBar({
  notes,
  activeId,
  onSelect,
  onCreate,
  onDelete,
  onOpenSettings,
  onOpenShare,
  canShare,
  onOpenContrib,
  canContrib,
  isContrib,
}: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <header className="flex h-11 flex-shrink-0 items-stretch border-b border-[#1a1a1a] bg-[#0f0f0f]">
      {/* Scrollable note tabs */}
      <div
        ref={scrollRef}
        className="flex min-w-0 flex-1 items-stretch overflow-x-auto"
        style={{ scrollbarWidth: "none" }}
      >
        <style>{`.no-scrollbar::-webkit-scrollbar{display:none}`}</style>
        {notes.map((note) => {
          const isActive = note.id === activeId;
          const isHovered = hoveredId === note.id;
          const title = getTitle(note.content, 24);

          return (
            <div
              key={note.id}
              className={`group relative flex flex-shrink-0 cursor-pointer items-center gap-2 border-r border-[#1a1a1a] px-4 transition-colors ${
                isActive
                  ? "bg-[#0a0a0a]"
                  : "hover:bg-[#141414]"
              }`}
              style={{ maxWidth: 180 }}
              onClick={() => onSelect(note.id)}
              onMouseEnter={() => setHoveredId(note.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {isActive && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-px"
                  style={{ background: "#39ff14" }}
                />
              )}

              <span
                className={`truncate text-xs font-medium ${
                  isActive ? "text-[#e8e8e8]" : "text-[#555]"
                }`}
              >
                {title === "Untitled" ? (
                  <span className={isActive ? "text-[#444]" : "text-[#333]"}>
                    Untitled
                  </span>
                ) : (
                  title
                )}
              </span>

              {isHovered && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(note.id);
                  }}
                  title="Delete note"
                  className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded text-[#444] transition-colors hover:text-red-400"
                >
                  <X size={10} strokeWidth={2.5} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="flex flex-shrink-0 items-center gap-1 border-l border-[#1a1a1a] px-2">
        <button
          onClick={onOpenShare}
          disabled={!canShare}
          title="Share note (⌘⇧S)"
          className="flex h-7 w-7 items-center justify-center rounded text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-[#39ff14] disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Share2 size={13} strokeWidth={2} />
        </button>
        <button
          onClick={onOpenContrib}
          disabled={!canContrib}
          title={isContrib ? "Contribution link" : "Make contribution note"}
          className={`flex h-7 w-7 items-center justify-center rounded transition-colors hover:bg-[#1a1a1a] hover:text-[#39ff14] disabled:cursor-not-allowed disabled:opacity-30 ${
            isContrib ? "text-[#39ff14]" : "text-[#555]"
          }`}
        >
          <Users size={13} strokeWidth={2} />
        </button>
        <button
          onClick={onCreate}
          title="New note (⌘N)"
          className="flex h-7 w-7 items-center justify-center rounded text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-[#39ff14]"
        >
          <Plus size={15} strokeWidth={2} />
        </button>
        <button
          onClick={onOpenSettings}
          title="Settings"
          className="flex h-7 w-7 items-center justify-center rounded text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-[#e8e8e8]"
        >
          <Settings size={13} strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}

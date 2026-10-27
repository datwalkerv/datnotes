"use client";

import { Plus, Search, Settings, Share2, Users, X } from "lucide-react";
import { useRef, useState } from "react";
import type { Note } from "@/lib/types";
import { getTitle } from "@/lib/utils";

interface Props {
  notes: Note[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onOpenSearch: () => void;
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
  onOpenSearch,
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
    <header className="flex h-11 flex-shrink-0 items-stretch border-b border-(--dt-border) bg-(--dt-background-secondary)">
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
              className={`group relative flex flex-shrink-0 cursor-pointer items-center gap-2 border-r border-(--dt-border) px-4 transition-colors ${
                isActive
                  ? "bg-(--dt-background)"
                  : "hover:bg-(--dt-background-tertiary)"
              }`}
              style={{ maxWidth: 180 }}
              onClick={() => onSelect(note.id)}
              onMouseEnter={() => setHoveredId(note.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {isActive && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-px"
                  style={{ background: "var(--dt-primary)" }}
                />
              )}

              <span
                className={`truncate text-xs font-medium ${
                  isActive ? "text-(--dt-foreground)" : "text-(--dt-subtle-foreground)"
                }`}
              >
                {title === "Untitled" ? (
                  <span className={isActive ? "text-(--dt-icon-tertiary)" : "text-(--dt-icon-tertiary)"}>
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
                  className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded text-(--dt-icon-tertiary) transition-colors hover:text-(--dt-destructive-hover)"
                >
                  <X size={10} strokeWidth={2.5} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="flex flex-shrink-0 items-center gap-1 border-l border-(--dt-border) px-2">
        <button
          onClick={onOpenSearch}
          title="Search notes (⌘K)"
          className="flex h-7 w-7 items-center justify-center rounded text-(--dt-subtle-foreground) transition-colors hover:bg-(--dt-accent) hover:text-(--dt-accent-foreground)"
        >
          <Search size={13} strokeWidth={2} />
        </button>
        <button
          onClick={onOpenShare}
          disabled={!canShare}
          title="Share note (⌘⇧S)"
          className="flex h-7 w-7 items-center justify-center rounded text-(--dt-subtle-foreground) transition-colors hover:bg-(--dt-accent) hover:text-(--dt-accent-foreground) disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Share2 size={13} strokeWidth={2} />
        </button>
        <button
          onClick={onOpenContrib}
          disabled={!canContrib}
          title={isContrib ? "Contribution link" : "Make contribution note"}
          className={`flex h-7 w-7 items-center justify-center rounded transition-colors hover:bg-(--dt-accent) hover:text-(--dt-accent-foreground) disabled:cursor-not-allowed disabled:opacity-30 ${
            isContrib ? "text-(--dt-accent-foreground)" : "text-(--dt-subtle-foreground)"
          }`}
        >
          <Users size={13} strokeWidth={2} />
        </button>
        <button
          onClick={onCreate}
          title="New note (⌘N)"
          className="flex h-7 w-7 items-center justify-center rounded text-(--dt-subtle-foreground) transition-colors hover:bg-(--dt-accent) hover:text-(--dt-accent-foreground)"
        >
          <Plus size={15} strokeWidth={2} />
        </button>
        <button
          onClick={onOpenSettings}
          title="Settings"
          className="flex h-7 w-7 items-center justify-center rounded text-(--dt-subtle-foreground) transition-colors hover:bg-(--dt-accent) hover:text-(--dt-foreground)"
        >
          <Settings size={13} strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}

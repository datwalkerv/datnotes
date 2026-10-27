"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import type { Note } from "@/lib/types";
import { formatDate, getTitle, searchNotes } from "@/lib/utils";

interface Props {
  notes: Note[];
  onSelect: (id: string) => void;
  onCreate: (content: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (i === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-sm bg-(--dt-mark) px-px text-(--dt-accent-foreground)">
        {text.slice(i, i + q.length)}
      </mark>
      {text.slice(i + q.length)}
    </>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-4 min-w-4 items-center justify-center rounded border border-(--dt-border) bg-(--dt-muted) px-1 font-sans text-[10px] text-(--dt-muted-foreground) shadow-(--dt-shadow-sm)">
      {children}
    </kbd>
  );
}

export default function QuickSwitcher({ notes, onSelect, onCreate, onDelete, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const overlayRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const results = useMemo(() => searchNotes(notes, query), [notes, query]);
  // Last row is always "create note"
  const rowCount = results.length + 1;

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${selected}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  const choose = (index: number) => {
    const match = results[index];
    if (match) onSelect(match.note.id);
    else onCreate(query.trim());
    onClose();
  };

  const remove = (index: number) => {
    const match = results[index];
    if (!match) return;
    onDelete(match.note.id);
    // Stay on a note row (the list is one shorter now) rather than jumping to "New note"
    setSelected(Math.max(0, Math.min(index, results.length - 2)));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      remove(selected);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => (s + 1) % rowCount);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => (s - 1 + rowCount) % rowCount);
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(e.metaKey || e.ctrlKey ? results.length : selected);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  const optionId = (i: number) => `switcher-option-${i}`;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-start justify-center bg-(--dt-overlay) px-4 pt-[15vh] backdrop-blur-sm"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search notes"
        className="w-full max-w-lg overflow-hidden rounded-xl border border-(--dt-border) bg-(--dt-card) shadow-(--dt-shadow-lg)"
      >
        <div className="flex items-center gap-2.5 border-b border-(--dt-separator) px-4">
          <Search size={14} strokeWidth={2} className="flex-shrink-0 text-(--dt-icon-secondary)" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search notes…"
            role="combobox"
            aria-expanded="true"
            aria-controls="switcher-list"
            aria-activedescendant={optionId(selected)}
            className="h-12 flex-1 bg-transparent text-sm text-(--dt-foreground) placeholder:text-(--dt-icon-tertiary) focus:outline-none"
          />
          <Kbd>esc</Kbd>
        </div>

        <ul
          ref={listRef}
          id="switcher-list"
          role="listbox"
          className="max-h-[min(60vh,420px)] overflow-y-auto p-1.5"
        >
          {results.map(({ note, snippet }, i) => {
            const title = getTitle(note.content, 60);
            return (
              <li
                key={note.id}
                id={optionId(i)}
                data-index={i}
                role="option"
                aria-selected={i === selected}
                onMouseMove={() => setSelected(i)}
                onClick={() => choose(i)}
                className={`group flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 transition-colors ${
                  i === selected ? "bg-(--dt-accent)" : ""
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-sm ${
                      title === "Untitled"
                        ? "text-(--dt-icon-tertiary)"
                        : i === selected
                          ? "text-(--dt-accent-foreground)"
                          : "text-(--dt-secondary-foreground)"
                    }`}
                  >
                    <Highlight text={title} query={query} />
                  </p>
                  {snippet && (
                    <p
                      className={`mt-0.5 truncate text-xs ${
                        i === selected ? "text-(--dt-muted-foreground)" : "text-(--dt-subtle-foreground)"
                      }`}
                    >
                      <Highlight text={snippet} query={query} />
                    </p>
                  )}
                </div>
                <span className="flex-shrink-0 text-[10px] text-(--dt-subtle-foreground) group-hover:hidden">
                  {formatDate(note.updatedAt)}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(i);
                  }}
                  tabIndex={-1}
                  aria-label="Delete note"
                  title="Delete note (⌘⌫)"
                  className="hidden h-5 w-5 flex-shrink-0 items-center justify-center rounded text-(--dt-icon-tertiary) transition-colors hover:bg-(--dt-secondary-hover) hover:text-(--dt-destructive-hover) group-hover:flex"
                >
                  <X size={12} strokeWidth={2.5} />
                </button>
              </li>
            );
          })}

          {results.length === 0 && (
            <li className="px-3 py-2 text-xs text-(--dt-subtle-foreground)">No matching notes</li>
          )}

          <li
            id={optionId(results.length)}
            data-index={results.length}
            role="option"
            aria-selected={selected === results.length}
            onMouseMove={() => setSelected(results.length)}
            onClick={() => choose(results.length)}
            className={`flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
              selected === results.length
                ? "bg-(--dt-accent) text-(--dt-accent-foreground)"
                : "text-(--dt-muted-foreground)"
            }`}
          >
            <Plus size={14} strokeWidth={2} className="flex-shrink-0 text-(--dt-icon-secondary)" />
            <span className="min-w-0 flex-1 truncate">
              {query.trim() ? <>New note “{query.trim()}”</> : "New note"}
            </span>
            <Kbd>⌘↵</Kbd>
          </li>
        </ul>

        <div className="flex items-center gap-4 border-t border-(--dt-separator) bg-(--dt-background) px-4 py-2 text-[10px] text-(--dt-subtle-foreground)">
          <span className="flex items-center gap-1.5">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            navigate
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd>↵</Kbd>
            open
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd>⌘⌫</Kbd>
            delete
          </span>
          <span className="ml-auto">
            {results.length} {results.length === 1 ? "note" : "notes"}
          </span>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Note } from "@/lib/types";
import {
  clearAll,
  loadActiveNoteId,
  loadNotes,
  saveActiveNoteId,
  saveNotes,
} from "@/lib/storage";
import { generateId } from "@/lib/utils";
import TopBar from "./TopBar";
import Editor from "./Editor";
import SettingsModal from "./SettingsModal";
import ShareModal from "./ShareModal";

function makeEmptyNote(): Note {
  const now = new Date().toISOString();
  return { id: generateId(), content: "", createdAt: now, updatedAt: now };
}

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let stored = loadNotes();
    const storedActiveId = loadActiveNoteId();

    // Always ensure at least one note exists
    if (stored.length === 0) {
      const note = makeEmptyNote();
      stored = [note];
      saveNotes(stored);
    }

    setNotes(stored);

    const validActive =
      storedActiveId && stored.find((n) => n.id === storedActiveId)
        ? storedActiveId
        : stored[0].id;
    setActiveId(validActive);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) saveActiveNoteId(activeId);
  }, [activeId, mounted]);

  const persistNotes = useCallback((updated: Note[]) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveNotes(updated), 200);
  }, []);

  const createNote = useCallback(() => {
    const note = makeEmptyNote();
    setNotes((prev) => {
      const updated = [...prev, note];
      saveNotes(updated);
      return updated;
    });
    setActiveId(note.id);
    saveActiveNoteId(note.id);
  }, []);

  const updateNote = useCallback(
    (id: string, content: string) => {
      setNotes((prev) => {
        const updated = prev.map((n) =>
          n.id === id ? { ...n, content, updatedAt: new Date().toISOString() } : n
        );
        persistNotes(updated);
        return updated;
      });
    },
    [persistNotes]
  );

  const deleteNote = useCallback(
    (id: string) => {
      setNotes((prev) => {
        let updated = prev.filter((n) => n.id !== id);

        // Always keep at least one note
        if (updated.length === 0) {
          const note = makeEmptyNote();
          updated = [note];
          saveNotes(updated);
          setActiveId(note.id);
          saveActiveNoteId(note.id);
          return updated;
        }

        saveNotes(updated);

        if (id === activeId) {
          const newActive = updated[0].id;
          setActiveId(newActive);
          saveActiveNoteId(newActive);
        }

        return updated;
      });
    },
    [activeId]
  );

  const deleteAll = useCallback(() => {
    const note = makeEmptyNote();
    clearAll();
    saveNotes([note]);
    setNotes([note]);
    setActiveId(note.id);
    saveActiveNoteId(note.id);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        createNote();
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "S") {
        e.preventDefault();
        if (activeNote?.content) setShareOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [createNote, activeNote]);

  const activeNote = notes.find((n) => n.id === activeId) ?? null;

  if (!mounted) {
    return <div className="h-screen bg-[#0a0a0a]" />;
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0a0a0a]">
      <TopBar
        notes={notes}
        activeId={activeId}
        onSelect={setActiveId}
        onCreate={createNote}
        onDelete={deleteNote}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenShare={() => setShareOpen(true)}
        canShare={!!activeNote?.content}
      />

      <main className="flex flex-1 flex-col overflow-hidden">
        {activeNote && (
          <Editor note={activeNote} onChange={updateNote} />
        )}
      </main>

      {settingsOpen && (
        <SettingsModal
          noteCount={notes.length}
          onDeleteAll={deleteAll}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {shareOpen && activeNote && (
        <ShareModal note={activeNote} onClose={() => setShareOpen(false)} />
      )}
    </div>
  );
}

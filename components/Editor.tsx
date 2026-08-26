"use client";

import { useEffect, useRef } from "react";
import type { Note } from "@/lib/types";

interface Props {
  note: Note;
  onChange: (id: string, content: string) => void;
}

export default function Editor({ note, onChange }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const idRef = useRef(note.id);

  // When the active note changes, sync textarea value and focus
  useEffect(() => {
    if (note.id !== idRef.current) {
      idRef.current = note.id;
    }
    const ta = textareaRef.current;
    if (!ta) return;
    if (ta.value !== note.content) {
      ta.value = note.content;
    }
    ta.focus();
    if (note.content === "") {
      ta.setSelectionRange(0, 0);
    }
  }, [note.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex h-full flex-col">
      <textarea
        ref={textareaRef}
        key={note.id}
        defaultValue={note.content}
        onChange={(e) => onChange(note.id, e.target.value)}
        className="flex-1 overflow-y-auto bg-transparent px-8 py-8 text-[15px] leading-relaxed text-[#d8d8d8] placeholder-[#2a2a2a] focus:outline-none"
        placeholder="Start writing…"
        spellCheck
        autoComplete="off"
      />
    </div>
  );
}

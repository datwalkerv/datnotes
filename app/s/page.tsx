"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { decodeNote, SharePayloadError } from "@/lib/share";
import type { SharedPayload } from "@/lib/types";
import { generateId } from "@/lib/utils";
import { loadNotes, saveNotes, saveActiveNoteId } from "@/lib/storage";
import type { Note } from "@/lib/types";

type DecodeState =
  | { status: "loading" }
  | { status: "success"; payload: SharedPayload }
  | { status: "error"; reason: "malformed" | "unsupported-version" | "empty" };

export default function SharedNotePage() {
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<DecodeState>({ status: "loading" });
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const hash = window.location.hash.slice(1);
    if (!hash) {
      setState({ status: "error", reason: "empty" });
      return;
    }
    decodeNote(hash)
      .then((payload) => setState({ status: "success", payload }))
      .catch((err) => {
        const reason =
          err instanceof SharePayloadError ? err.reason : "malformed";
        setState({ status: "error", reason });
      });
  }, []);

  const handleSave = () => {
    if (state.status !== "success") return;
    const now = new Date().toISOString();
    const notes = loadNotes();
    const newNotes: Note[] = state.payload.n.map((entry) => ({
      id: generateId(),
      content: entry.c,
      createdAt: entry.ca ?? now,
      updatedAt: entry.ua ?? now,
    }));
    const merged = [...notes, ...newNotes];
    saveNotes(merged);
    saveActiveNoteId(newNotes[0].id);
    setSaved(true);
    setTimeout(() => router.push("/"), 600);
  };

  const handleCopy = async () => {
    if (state.status !== "success") return;
    const text = state.payload.n.map((e) => e.c).join("\n\n---\n\n");
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!mounted || state.status === "loading") {
    return (
      <div className="flex h-screen flex-col bg-(--dt-background)">
        <div className="h-11 border-b border-(--dt-border) bg-(--dt-background-secondary)" />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-4 w-32 animate-pulse rounded bg-(--dt-skeleton-from)" />
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    const msg =
      state.reason === "unsupported-version"
        ? "This link was created with a newer version of datnotes. Try updating your app."
        : "This link appears to be broken or incomplete.";
    return (
      <div className="flex h-screen flex-col bg-(--dt-background)">
        <div className="flex h-11 items-center border-b border-(--dt-border) bg-(--dt-background-secondary) px-4">
          <span className="text-xs font-medium text-(--dt-subtle-foreground)">datnotes</span>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-sm text-(--dt-foreground)">Couldn&apos;t open this note</p>
          <p className="max-w-xs text-xs text-(--dt-subtle-foreground)">{msg}</p>
          <a
            href="/"
            className="mt-2 rounded-md border border-(--dt-border) px-4 py-2 text-xs font-medium text-(--dt-subtle-foreground) transition-colors hover:border-(--dt-input-border) hover:text-(--dt-muted-foreground)"
          >
            Go to datnotes
          </a>
        </div>
      </div>
    );
  }

  const entry = state.payload.n[0];
  const firstLine = entry.c.split("\n")[0].trim() || "Untitled";
  const preview = entry.c;

  return (
    <div className="flex h-screen flex-col bg-(--dt-background)">
      {/* Header bar */}
      <div className="flex h-11 flex-shrink-0 items-center justify-between border-b border-(--dt-border) bg-(--dt-background-secondary) px-4">
        <span className="text-xs font-medium text-(--dt-subtle-foreground)">datnotes · shared note</span>
        <a
          href="/"
          className="text-xs text-(--dt-icon-tertiary) transition-colors hover:text-(--dt-subtle-foreground)"
        >
          Open app
        </a>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-6 py-8">
          {/* Title */}
          <p className="mb-6 truncate text-sm font-semibold text-(--dt-foreground)">
            {firstLine}
          </p>

          {/* Read-only note content */}
          <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-(--dt-secondary-foreground)">
            {preview}
          </pre>
        </div>

        {/* Action bar */}
        <div className="flex-shrink-0 border-t border-(--dt-border) bg-(--dt-background-secondary) px-6 py-4">
          <p className="mb-3 text-center text-xs text-(--dt-subtle-foreground)">
            This note was shared via a self-contained link. It was never uploaded to any server.
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={handleCopy}
              className="rounded-md border border-(--dt-border) px-4 py-2 text-xs font-medium text-(--dt-subtle-foreground) transition-colors hover:border-(--dt-input-border) hover:text-(--dt-muted-foreground)"
            >
              {copied ? "Copied!" : "Copy text"}
            </button>
            <button
              onClick={handleSave}
              disabled={saved}
              className="rounded-md bg-(--dt-primary) px-4 py-2 text-xs font-medium text-(--dt-primary-foreground) transition-colors hover:bg-(--dt-primary-hover) disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saved ? "Saved!" : "Save to my notes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

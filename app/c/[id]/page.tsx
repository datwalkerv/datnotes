"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { decrypt, encrypt, type Encrypted } from "@/lib/crypto";
import { generateId } from "@/lib/utils";
import { loadNotes, saveNotes, saveActiveNoteId } from "@/lib/storage";
import type { Note } from "@/lib/types";

type LoadState =
  | { status: "loading" }
  | { status: "ready" }
  | { status: "error"; reason: "not-found" | "broken" | "network" };

type SaveStatus = "idle" | "saving" | "saved" | "error";

const SAVE_DEBOUNCE_MS = 600;
const POLL_MS = 3000;

export default function ContribNotePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [content, setContent] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saved, setSaved] = useState(false);
  const keyRef = useRef("");
  const updatedAtRef = useRef("");
  // True while a local edit is waiting to be saved or is in flight
  const dirtyRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchRemote = useCallback(async () => {
    const res = await fetch(`/api/c/${id}`, { cache: "no-store" });
    if (res.status === 404) throw new Error("not-found");
    if (!res.ok) throw new Error("network");
    return (await res.json()) as Encrypted & { updatedAt: string };
  }, [id]);

  useEffect(() => {
    keyRef.current = window.location.hash.slice(1);
    if (!keyRef.current) {
      setState({ status: "error", reason: "broken" });
      return;
    }
    fetchRemote()
      .then(async (doc) => {
        let text: string;
        try {
          text = await decrypt(keyRef.current, doc);
        } catch {
          throw new Error("broken");
        }
        updatedAtRef.current = doc.updatedAt;
        setContent(text);
        setState({ status: "ready" });
      })
      .catch((err: Error) => {
        const reason =
          err.message === "not-found" || err.message === "broken" ? err.message : "network";
        setState({ status: "error", reason });
      });
  }, [fetchRemote]);

  // shortcut: last write wins, concurrent typing can clobber; upgrade to versioned PUT or CRDT if it bites.
  useEffect(() => {
    if (state.status !== "ready") return;
    const timer = setInterval(async () => {
      if (dirtyRef.current) return;
      try {
        const doc = await fetchRemote();
        if (doc.updatedAt === updatedAtRef.current || dirtyRef.current) return;
        const text = await decrypt(keyRef.current, doc);
        if (dirtyRef.current) return;
        updatedAtRef.current = doc.updatedAt;
        setContent(text);
      } catch {
        // transient poll failure — try again next tick
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [state.status, fetchRemote]);

  const save = useCallback(
    async (text: string) => {
      setSaveStatus("saving");
      try {
        const res = await fetch(`/api/c/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(await encrypt(keyRef.current, text)),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        updatedAtRef.current = (await res.json()).updatedAt;
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      } finally {
        // A newer edit may have been queued while this save was in flight
        if (!saveTimer.current) dirtyRef.current = false;
      }
    },
    [id]
  );

  const handleChange = (text: string) => {
    setContent(text);
    dirtyRef.current = true;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      save(text);
    }, SAVE_DEBOUNCE_MS);
  };

  const handleSave = () => {
    const now = new Date().toISOString();
    const note: Note = { id: generateId(), content, createdAt: now, updatedAt: now };
    saveNotes([...loadNotes(), note]);
    saveActiveNoteId(note.id);
    setSaved(true);
    setTimeout(() => router.push("/"), 600);
  };

  if (state.status === "loading") {
    return (
      <div className="flex h-screen flex-col bg-[#0a0a0a]">
        <div className="h-11 border-b border-[#1a1a1a] bg-[#0f0f0f]" />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-4 w-32 animate-pulse rounded bg-[#1a1a1a]" />
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    const msg =
      state.reason === "not-found"
        ? "This contribution note doesn't exist or was removed."
        : state.reason === "broken"
        ? "This link appears to be broken or incomplete."
        : "Couldn't reach the server. Check your connection and try again.";
    return (
      <div className="flex h-screen flex-col bg-[#0a0a0a]">
        <div className="flex h-11 items-center border-b border-[#1a1a1a] bg-[#0f0f0f] px-4">
          <span className="text-xs font-medium text-[#555]">datnotes</span>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-sm text-[#e8e8e8]">Couldn&apos;t open this note</p>
          <p className="max-w-xs text-xs text-[#555]">{msg}</p>
          <Link
            href="/"
            className="mt-2 rounded-md border border-[#222] px-4 py-2 text-xs font-medium text-[#666] transition-colors hover:border-[#333] hover:text-[#999]"
          >
            Go to datnotes
          </Link>
        </div>
      </div>
    );
  }

  const statusText = {
    idle: "",
    saving: "Saving…",
    saved: "Saved",
    error: "Save failed — keep typing to retry",
  }[saveStatus];

  return (
    <div className="flex h-screen flex-col bg-[#0a0a0a]">
      <div className="flex h-11 flex-shrink-0 items-center justify-between border-b border-[#1a1a1a] bg-[#0f0f0f] px-4">
        <span className="text-xs font-medium text-[#555]">datnotes · contribution note</span>
        <div className="flex items-center gap-4">
          <span
            className={`text-[10px] ${saveStatus === "error" ? "text-red-400" : "text-[#444]"}`}
            aria-live="polite"
          >
            {statusText}
          </span>
          <button
            onClick={handleSave}
            disabled={saved}
            className="text-xs text-[#39ff14] transition-colors hover:text-[#39ff14]/80 disabled:opacity-50"
          >
            {saved ? "Saved!" : "Save to my notes"}
          </button>
          <Link href="/" className="text-xs text-[#444] transition-colors hover:text-[#666]">
            Open app
          </Link>
        </div>
      </div>

      <textarea
        value={content}
        onChange={(e) => handleChange(e.target.value)}
        aria-label="Note content"
        className="flex-1 overflow-y-auto bg-transparent px-8 py-8 text-[15px] leading-relaxed text-[#d8d8d8] placeholder-[#2a2a2a] focus:outline-none"
        placeholder="Start writing…"
        spellCheck
        autoComplete="off"
        autoFocus
      />

      <p className="flex-shrink-0 border-t border-[#1a1a1a] bg-[#0f0f0f] px-6 py-3 text-center text-[10px] text-[#444]">
        Anyone with this link can edit. Content is end-to-end encrypted — the server only stores
        ciphertext.
      </p>
    </div>
  );
}

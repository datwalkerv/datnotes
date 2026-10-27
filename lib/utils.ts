import type { Note } from "./types";

export function getTitle(content: string, maxLength = 32): string {
  const firstLine = content.split("\n")[0].trim();
  if (!firstLine) return "Untitled";
  return firstLine.length > maxLength
    ? firstLine.slice(0, maxLength).trimEnd() + "…"
    : firstLine;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export interface NoteMatch {
  note: Note;
  // Text shown under the title: the matched excerpt, or the note's second line
  snippet: string;
}

// Case-insensitive substring search; title hits first, then most recently edited
export function searchNotes(notes: Note[], query: string): NoteMatch[] {
  const q = query.trim().toLowerCase();
  const byRecent = [...notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const titleHits: NoteMatch[] = [];
  const bodyHits: NoteMatch[] = [];

  for (const note of byRecent) {
    const [first, ...rest] = note.content.split("\n");
    const body = rest.join(" ").replace(/\s+/g, " ").trim();
    if (!q) {
      titleHits.push({ note, snippet: body.slice(0, 80) });
    } else if (first.toLowerCase().includes(q)) {
      titleHits.push({ note, snippet: body.slice(0, 80) });
    } else {
      const i = body.toLowerCase().indexOf(q);
      if (i === -1) continue;
      const start = Math.max(0, i - 30);
      bodyHits.push({ note, snippet: (start ? "…" : "") + body.slice(start, i + q.length + 50) });
    }
  }
  return [...titleHits, ...bodyHits];
}

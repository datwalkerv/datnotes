import type { Note } from "./types";

const NOTES_KEY = "datnotes_notes";
const ACTIVE_KEY = "datnotes_active";

function isAvailable(): boolean {
  try {
    const test = "__test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

export function loadNotes(): Note[] {
  if (!isAvailable()) return [];
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveNotes(notes: Note[]): void {
  if (!isAvailable()) return;
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  } catch {
    // quota exceeded or unavailable — fail silently
  }
}

export function loadActiveNoteId(): string | null {
  if (!isAvailable()) return null;
  try {
    return localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

export function saveActiveNoteId(id: string | null): void {
  if (!isAvailable()) return;
  try {
    if (id === null) {
      localStorage.removeItem(ACTIVE_KEY);
    } else {
      localStorage.setItem(ACTIVE_KEY, id);
    }
  } catch {
    // fail silently
  }
}

export function clearAll(): void {
  if (!isAvailable()) return;
  try {
    localStorage.removeItem(NOTES_KEY);
    localStorage.removeItem(ACTIVE_KEY);
  } catch {
    // fail silently
  }
}

export interface Note {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppState {
  notes: Note[];
  activeNoteId: string | null;
}

export interface SharedPayload {
  v: number;
  n: Array<{ c: string; ca: string; ua: string }>;
}

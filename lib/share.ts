import type { Note } from "./types";

export interface SharedPayload {
  v: number;
  n: Array<{ c: string; ca: string; ua: string }>;
}

export type SharePayloadErrorReason = "malformed" | "unsupported-version";

export class SharePayloadError extends Error {
  constructor(
    public readonly reason: SharePayloadErrorReason,
    message: string
  ) {
    super(message);
    this.name = "SharePayloadError";
  }
}

// URL-safe base64 (no +, /, or =)
export function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export function fromBase64Url(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4;
  const full = pad ? padded + "=".repeat(4 - pad) : padded;
  const binary = atob(full);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function deflate(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new CompressionStream("deflate-raw");
  const writer = stream.writable.getWriter();
  writer.write(new Uint8Array(bytes.buffer as ArrayBuffer, bytes.byteOffset, bytes.byteLength));
  writer.close();
  const buf = await new Response(stream.readable).arrayBuffer();
  return new Uint8Array(buf as ArrayBuffer);
}

export async function inflate(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new DecompressionStream("deflate-raw");
  const writer = stream.writable.getWriter();
  writer.write(new Uint8Array(bytes.buffer as ArrayBuffer, bytes.byteOffset, bytes.byteLength));
  writer.close();
  const buf = await new Response(stream.readable).arrayBuffer();
  return new Uint8Array(buf as ArrayBuffer);
}

const hasCompressionStream =
  typeof CompressionStream !== "undefined";

export async function encodeNote(note: Note): Promise<string> {
  const payload: SharedPayload = {
    v: 1,
    n: [{ c: note.content, ca: note.createdAt, ua: note.updatedAt }],
  };
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);

  if (hasCompressionStream) {
    const compressed = await deflate(bytes);
    return `n1.${toBase64Url(compressed)}`;
  }
  return `n0.${toBase64Url(bytes)}`;
}

export async function decodeNote(fragment: string): Promise<SharedPayload> {
  const dot = fragment.indexOf(".");
  if (dot < 2) {
    throw new SharePayloadError("malformed", "Fragment missing mode/version prefix");
  }
  const mode = fragment.slice(0, dot);
  const body = fragment.slice(dot + 1);

  let bytes: Uint8Array;
  try {
    bytes = fromBase64Url(body);
  } catch {
    throw new SharePayloadError("malformed", "Invalid base64url encoding");
  }

  let json: string;
  if (mode === "n1") {
    try {
      const decompressed = await inflate(bytes);
      json = new TextDecoder().decode(decompressed);
    } catch {
      throw new SharePayloadError("malformed", "Decompression failed");
    }
  } else if (mode === "n0") {
    json = new TextDecoder().decode(bytes);
  } else if (mode.startsWith("n")) {
    throw new SharePayloadError("unsupported-version", `Unknown mode: ${mode}`);
  } else {
    throw new SharePayloadError("malformed", `Unknown mode type: ${mode}`);
  }

  let payload: SharedPayload;
  try {
    payload = JSON.parse(json) as SharedPayload;
  } catch {
    throw new SharePayloadError("malformed", "Invalid JSON payload");
  }

  if (!payload || typeof payload.v !== "number" || !Array.isArray(payload.n)) {
    throw new SharePayloadError("malformed", "Payload missing required fields");
  }
  if (payload.v > 1) {
    throw new SharePayloadError("unsupported-version", `Payload version ${payload.v} is not supported`);
  }

  return payload;
}

export async function estimateUrlLength(note: Note, origin: string): Promise<number> {
  const fragment = await encodeNote(note);
  return `${origin}/s#${fragment}`.length;
}

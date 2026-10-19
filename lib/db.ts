import { MongoClient, ObjectId } from "mongodb";

export interface ContribDoc {
  _id?: ObjectId;
  iv: string;
  ct: string;
  updatedAt: string;
}

// Cache on globalThis so dev HMR doesn't open a new pool per reload
const g = globalThis as unknown as { _mongo?: Promise<MongoClient> };

export async function contribs() {
  const { MONGODB_URI: uri, MONGODB_DB: dbName } = process.env;
  if (!uri || !dbName) throw new Error("MONGODB_URI and MONGODB_DB must be set (see .env.example)");
  g._mongo ??= new MongoClient(uri).connect();
  return (await g._mongo).db(dbName).collection<ContribDoc>("contribs");
}

const B64URL = /^[A-Za-z0-9_-]+$/;
const MAX_CT = 1_000_000;

// Validates an untrusted {iv, ct} body; returns null if invalid
export function parseEncrypted(body: unknown): { iv: string; ct: string } | null {
  const b = body as { iv?: unknown; ct?: unknown } | null;
  if (!b || typeof b.iv !== "string" || typeof b.ct !== "string") return null;
  if (b.iv.length !== 16 || !B64URL.test(b.iv)) return null;
  if (!b.ct.length || b.ct.length > MAX_CT || !B64URL.test(b.ct)) return null;
  return { iv: b.iv, ct: b.ct };
}

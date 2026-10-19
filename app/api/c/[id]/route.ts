import { ObjectId } from "mongodb";
import { contribs, parseEncrypted } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!ObjectId.isValid(id)) return Response.json({ error: "not found" }, { status: 404 });
  const doc = await (await contribs()).findOne({ _id: new ObjectId(id) });
  if (!doc) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(
    { iv: doc.iv, ct: doc.ct, updatedAt: doc.updatedAt },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!ObjectId.isValid(id)) return Response.json({ error: "not found" }, { status: 404 });
  const enc = parseEncrypted(await req.json().catch(() => null));
  if (!enc) return Response.json({ error: "invalid body" }, { status: 400 });
  const updatedAt = new Date().toISOString();
  const { matchedCount } = await (await contribs()).updateOne(
    { _id: new ObjectId(id) },
    { $set: { ...enc, updatedAt } }
  );
  if (!matchedCount) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({ updatedAt });
}

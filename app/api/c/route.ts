import { contribs, parseEncrypted } from "@/lib/db";

export async function POST(req: Request) {
  const enc = parseEncrypted(await req.json().catch(() => null));
  if (!enc) return Response.json({ error: "invalid body" }, { status: 400 });
  const { insertedId } = await (await contribs()).insertOne({
    ...enc,
    updatedAt: new Date().toISOString(),
  });
  return Response.json({ id: insertedId.toHexString() });
}

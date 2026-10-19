import { fromBase64Url, toBase64Url } from "./share";

export interface Encrypted {
  iv: string;
  ct: string;
}

function importKey(key: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", fromBase64Url(key) as BufferSource, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function newKey(): Promise<string> {
  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt",
  ]);
  return toBase64Url(new Uint8Array(await crypto.subtle.exportKey("raw", key)));
}

export async function encrypt(key: string, text: string): Promise<Encrypted> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await importKey(key),
    new TextEncoder().encode(text)
  );
  return { iv: toBase64Url(iv), ct: toBase64Url(new Uint8Array(ct)) };
}

// Throws on wrong key or tampered data (GCM auth tag)
export async function decrypt(key: string, { iv, ct }: Encrypted): Promise<string> {
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64Url(iv) as BufferSource },
    await importKey(key),
    fromBase64Url(ct) as BufferSource
  );
  return new TextDecoder().decode(plain);
}

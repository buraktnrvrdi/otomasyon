// Web Crypto kullanılır; hem Node hem Edge çalışma ortamında (middleware) çalışır.

export const SUPER_COOKIE = "super_session";
export const SUPER_OTURUM_SN = 60 * 60 * 12;

function sifre(): string | null {
  const s = process.env.SUPER_ADMIN_PASSWORD;
  return s && s.length >= 12 ? s : null;
}

async function imzala(veri: string, anahtar: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(anahtar),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(veri));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

function esitMi(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let fark = 0;
  for (let i = 0; i < a.length; i++) fark |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return fark === 0;
}

export function superAdminAyarliMi(): boolean {
  return sifre() !== null;
}

export async function sifreDogruMu(girilen: unknown): Promise<boolean> {
  const s = sifre();
  if (!s || typeof girilen !== "string") return false;
  // Uzunluk sızmasın diye iki tarafın da özeti karşılaştırılır.
  const [a, b] = await Promise.all([imzala(girilen, "sifre"), imzala(s, "sifre")]);
  return esitMi(a, b);
}

export async function oturumOlustur(): Promise<string> {
  const s = sifre();
  if (!s) throw new Error("SUPER_ADMIN_PASSWORD ayarlanmamis");
  const bitis = Math.floor(Date.now() / 1000) + SUPER_OTURUM_SN;
  return `${bitis}.${await imzala(`super:${bitis}`, s)}`;
}

export async function oturumGecerliMi(token: string | undefined): Promise<boolean> {
  const s = sifre();
  if (!s || !token) return false;
  const [bitisStr, sig] = token.split(".");
  const bitis = Number(bitisStr);
  if (!sig || !Number.isFinite(bitis) || bitis < Date.now() / 1000) return false;
  return esitMi(sig, await imzala(`super:${bitis}`, s));
}

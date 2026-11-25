import { createServerClient } from "@/lib/supabase/server";

/**
 * Genel amaçlı hız sınırı. Olaylar `giris_denemeleri` tablosunda (anahtar, zaman)
 * satırı olarak tutulur; ayrı bir tablo gerekmez. Veritabanına ulaşılamazsa
 * kullanıcıyı kilitlemek yerine sınır atlanır (hata loglanır).
 */

export interface Kural {
  pencereMs: number;
  sinir: number;
}

export const DAKIKA = 60_000;
export const SAAT = 60 * DAKIKA;
export const GUN = 24 * SAAT;

export function istemciIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    headers.get("x-real-ip") ||
    "bilinmiyor"
  );
}

async function say(anahtar: string, pencereMs: number): Promise<number> {
  const supabase = await createServerClient();
  const { count, error } = await supabase
    .from("giris_denemeleri")
    .select("id", { count: "exact", head: true })
    .eq("anahtar", anahtar)
    .gt("zaman", new Date(Date.now() - pencereMs).toISOString());
  if (error) throw new Error(error.message);
  return count ?? 0;
}

/** Kurallardan biri aşılmışsa true. Hiçbir şey kaydetmez. */
export async function asildiMi(anahtar: string, kurallar: Kural[]): Promise<boolean> {
  try {
    const sayilar = await Promise.all(kurallar.map((k) => say(anahtar, k.pencereMs)));
    return kurallar.some((k, i) => sayilar[i] >= k.sinir);
  } catch (err) {
    console.error("[Sinirlayici]", err instanceof Error ? err.message : err);
    return false;
  }
}

/** Olayları kaydeder (başarısız giriş gibi, sadece kötü durumlar sayılacaksa). */
export async function kaydet(...anahtarlar: string[]): Promise<void> {
  try {
    const supabase = await createServerClient();
    await supabase.from("giris_denemeleri").insert(anahtarlar.map((anahtar) => ({ anahtar })));
  } catch (err) {
    console.error("[Sinirlayici kaydet]", err instanceof Error ? err.message : err);
  }
}

export async function temizle(anahtar: string): Promise<void> {
  try {
    const supabase = await createServerClient();
    await supabase.from("giris_denemeleri").delete().eq("anahtar", anahtar);
  } catch (err) {
    console.error("[Sinirlayici temizle]", err instanceof Error ? err.message : err);
  }
}

/** Hak varsa olayı kaydedip true döner; sınır aşılmışsa kaydetmeden false döner. */
export async function hakKullan(anahtar: string, kurallar: Kural[]): Promise<boolean> {
  if (await asildiMi(anahtar, kurallar)) return false;
  await kaydet(anahtar);
  return true;
}

/** Süresi dolan kayıtları siler (günlük görevden çağrılır). */
export async function eskileriTemizle(): Promise<void> {
  const supabase = await createServerClient();
  await supabase
    .from("giris_denemeleri")
    .delete()
    .lt("zaman", new Date(Date.now() - GUN - SAAT).toISOString());
}

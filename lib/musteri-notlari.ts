import { createServerClient } from "@/lib/supabase/server";

export const MAKS_NOT = 500;

/**
 * Müşteri numarasına göre salonun notları. Tablo yoksa (migration 011 çalışmadıysa)
 * ya da hata olursa boş döner; sayfalar notsuz çalışmaya devam eder.
 */
export async function notlariGetir(isletmeId: string, numaralar: string[]): Promise<Record<string, string>> {
  if (numaralar.length === 0) return {};
  try {
    const db = await createServerClient();
    const { data, error } = await db
      .from("musteri_notlari")
      .select("musteri_whatsapp, notu")
      .eq("isletme_id", isletmeId)
      .in("musteri_whatsapp", numaralar);
    if (error) return {};
    return Object.fromEntries((data ?? []).map((n) => [n.musteri_whatsapp as string, n.notu as string]));
  } catch {
    return {};
  }
}

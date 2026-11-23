import { createServerClient } from "@/lib/supabase/server";

export const AKTIF_DURUMLAR = ["beklemede", "onaylandi"] as const;
/** Saati geçmiş bir randevunun sonucu; admin ikisi arasında geçiş yapabilir */
export const SONUC_DURUMLARI: string[] = ["tamamlandi", "gelmedi"];

/**
 * Bitiş saati geçmiş aktif randevuları "tamamlandi" yapar. Ayrı bir zamanlanmış
 * görev yerine randevuları gösteren sayfalardan önce çağrılır; sorgu
 * idempotent olduğu için sık çağrılması zararsızdır.
 */
export async function gecmisleriTamamla(isletmeId: string): Promise<void> {
  const supabase = await createServerClient();
  const { error } = await supabase
    .from("randevular")
    .update({ durum: "tamamlandi" })
    .eq("isletme_id", isletmeId)
    .in("durum", AKTIF_DURUMLAR)
    .lt("bitis", new Date().toISOString());
  if (error) console.error("[Randevu tamamla]", error.message);
}

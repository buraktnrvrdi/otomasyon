import { randomUUID } from "node:crypto";
import { createServerClient } from "@/lib/supabase/server";
import { AKTIF_DURUMLAR } from "@/lib/randevu-durum";
import { SILINMIS_AD, SILINMIS_ON_EK } from "@/lib/kvkk";

export type SilmeSonucu =
  | { ok: true; anonimlestirilen: number }
  | { ok: false; durum: number; hata: string };

/**
 * Müşterinin kişisel verilerini siler (KVKK m.7 talebi): sohbet geçmişi silinir,
 * randevu kayıtları ciro/istatistik bozulmasın diye ad ve numara kaldırılarak anonimleştirilir.
 */
export async function musteriVerisiniSil(isletmeId: string, musteriNo: string): Promise<SilmeSonucu> {
  if (!musteriNo || musteriNo.startsWith(SILINMIS_ON_EK)) {
    return { ok: false, durum: 400, hata: "Geçersiz istek." };
  }
  const db = await createServerClient();

  // Gelecekteki aktif randevusu varken silinirse hatırlatma ve iptal yolları kaybolur.
  const { count } = await db
    .from("randevular")
    .select("id", { count: "exact", head: true })
    .eq("isletme_id", isletmeId)
    .eq("musteri_whatsapp", musteriNo)
    .in("durum", [...AKTIF_DURUMLAR])
    .gt("bitis", new Date().toISOString());
  if ((count ?? 0) > 0) {
    return {
      ok: false,
      durum: 409,
      hata: "Bu müşterinin ileri tarihli aktif randevusu var. Önce randevuyu iptal et, sonra verileri sil.",
    };
  }

  const yerTutucu = `${SILINMIS_ON_EK}${randomUUID().slice(0, 8)}`;
  const { data, error } = await db
    .from("randevular")
    .update({ musteri_ad: SILINMIS_AD, musteri_whatsapp: yerTutucu, notlar: null })
    .eq("isletme_id", isletmeId)
    .eq("musteri_whatsapp", musteriNo)
    .select("id");
  if (error) return { ok: false, durum: 500, hata: "Silinemedi." };

  await db.from("konusmalar").delete().eq("isletme_id", isletmeId).eq("musteri_no", musteriNo);
  // Salonun tuttuğu özel not da kişisel veridir (tablo yoksa hata yok sayılır).
  await db.from("musteri_notlari").delete().eq("isletme_id", isletmeId).eq("musteri_whatsapp", musteriNo);
  return { ok: true, anonimlestirilen: data?.length ?? 0 };
}

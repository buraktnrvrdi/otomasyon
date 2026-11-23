import { createServerClient } from "@/lib/supabase/server";
import { gunEkle, haftaGunu, saatiDakikaya, yerelAn } from "./zaman";
import { AKTIF_DURUMLAR } from "@/lib/randevu-durum";

export interface BosSlot {
  baslangic: Date;
  bitis: Date;
  baslangicStr: string;
}

const ADIM = 30;
const MIN_ONCEDEN_DAKIKA = 15;

/** tarih: işletme saatine göre "YYYY-MM-DD" */
export async function bosSlotlariGetir(
  isletmeId: string,
  tarih: string,
  hizmetSureDakika = 30
): Promise<BosSlot[]> {
  const supabase = await createServerClient();

  const { data: calisma } = await supabase
    .from("calisma_saatleri")
    .select("acilis, kapanis, kapali")
    .eq("isletme_id", isletmeId)
    .eq("gun", haftaGunu(tarih))
    .maybeSingle();

  if (!calisma || calisma.kapali) return [];

  const acilis = saatiDakikaya(calisma.acilis.slice(0, 5));
  const kapanis = saatiDakikaya(calisma.kapanis.slice(0, 5));
  if (acilis === null || kapanis === null) return [];

  const gunBaslangic = yerelAn(tarih, 0);
  const gunBitis = yerelAn(gunEkle(tarih, 1), 0);

  // Bu güne taşan tüm randevular (önceki günden sarkanlar dahil)
  const { data: mevcutRandevular } = await supabase
    .from("randevular")
    .select("baslangic, bitis")
    .eq("isletme_id", isletmeId)
    .lt("baslangic", gunBitis.toISOString())
    .gt("bitis", gunBaslangic.toISOString())
    .in("durum", AKTIF_DURUMLAR);

  const dk = (iso: string) => (new Date(iso).getTime() - gunBaslangic.getTime()) / 60_000;
  const mesgul = (mevcutRandevular ?? []).map((r) => ({ bas: dk(r.baslangic), bit: dk(r.bitis) }));

  const enErken = Date.now() + MIN_ONCEDEN_DAKIKA * 60_000;
  const bosSlotlar: BosSlot[] = [];

  for (let dakika = acilis; dakika + hizmetSureDakika <= kapanis; dakika += ADIM) {
    const slotBit = dakika + hizmetSureDakika;
    const baslangic = yerelAn(tarih, dakika);

    if (baslangic.getTime() < enErken) continue;
    if (mesgul.some((m) => dakika < m.bit && slotBit > m.bas)) continue;

    bosSlotlar.push({
      baslangic,
      bitis: new Date(baslangic.getTime() + hizmetSureDakika * 60_000),
      baslangicStr: `${String(Math.floor(dakika / 60)).padStart(2, "0")}:${String(dakika % 60).padStart(2, "0")}`,
    });
  }

  return bosSlotlar;
}

import { createServerClient } from "@/lib/supabase/server";
import { haftaGunu, saatiDakikaya } from "@/lib/utils/zaman";

export interface Mola {
  /** Gün başından itibaren dakika */
  bas: number;
  bit: number;
  aciklama: string | null;
}

export interface GunBilgisi {
  /** Haftalık çalışma saati; o gün kapalıysa null */
  calisma: { acilis: string; kapanis: string } | null;
  /** Tüm gün tatil/izin varsa açıklaması (açıklama yoksa boş metin); yoksa null */
  tatil: { aciklama: string } | null;
  /** Belirli saatlerdeki izinler (öğle arası vb.) */
  molalar: Mola[];
}

/**
 * Bir günün çalışma durumu: haftalık saatler + tatil/izin kayıtları.
 * Tatil tablosu yoksa (migration 010 çalışmadıysa) tatil yokmuş gibi davranılır.
 */
export async function gunBilgisiGetir(isletmeId: string, tarih: string): Promise<GunBilgisi> {
  const supabase = await createServerClient();

  const [{ data: calisma }, { data: kapalilar, error }] = await Promise.all([
    supabase
      .from("calisma_saatleri")
      .select("acilis, kapanis, kapali")
      .eq("isletme_id", isletmeId)
      .eq("gun", haftaGunu(tarih))
      .maybeSingle(),
    supabase
      .from("kapali_gunler")
      .select("baslangic_saat, bitis_saat, aciklama")
      .eq("isletme_id", isletmeId)
      .lte("baslangic_tarih", tarih)
      .gte("bitis_tarih", tarih),
  ]);
  if (error && error.code !== "PGRST205" && error.code !== "42P01") {
    console.error("[Gun bilgisi]", error.message);
  }

  let tatil: GunBilgisi["tatil"] = null;
  const molalar: Mola[] = [];
  for (const k of kapalilar ?? []) {
    if (!k.baslangic_saat || !k.bitis_saat) {
      tatil = { aciklama: k.aciklama ?? "" };
      continue;
    }
    const bas = saatiDakikaya(String(k.baslangic_saat).slice(0, 5));
    const bit = saatiDakikaya(String(k.bitis_saat).slice(0, 5));
    if (bas !== null && bit !== null) molalar.push({ bas, bit, aciklama: k.aciklama ?? null });
  }

  return {
    calisma:
      calisma && !calisma.kapali
        ? { acilis: String(calisma.acilis).slice(0, 5), kapanis: String(calisma.kapanis).slice(0, 5) }
        : null,
    tatil,
    molalar,
  };
}

import { createServerClient } from "@/lib/supabase/server";
import { bosSlotlariGetir } from "@/lib/utils/slot-calculator";
import { gecerliTarihMi, saatiDakikaya, yerelSaat, yerelTarih } from "@/lib/utils/zaman";
import { AKTIF_DURUMLAR } from "@/lib/randevu-durum";

/**
 * Müşteri kimliği (musteriNo) her zaman sunucudan gelir; modelin ürettiği
 * girdideki numara yok sayılır, böylece bir müşteri başkasının randevularına
 * erişemez.
 */
export async function toolCalistir(
  toolName: string,
  toolInput: Record<string, unknown>,
  isletmeId: string,
  musteriNo: string
): Promise<string> {
  const supabase = await createServerClient();

  const hizmetGetir = async (hizmetId: unknown) => {
    if (typeof hizmetId !== "string") return null;
    const { data } = await supabase
      .from("hizmetler")
      .select("sure_dakika, ad, fiyat")
      .eq("id", hizmetId)
      .eq("isletme_id", isletmeId)
      .eq("aktif", true)
      .maybeSingle();
    return data;
  };

  if (toolName === "bos_saat_bak") {
    const { tarih, hizmet_id } = toolInput as { tarih: string; hizmet_id?: string };

    if (!gecerliTarihMi(tarih)) {
      return JSON.stringify({ musait: false, hata: "Tarih YYYY-MM-DD olmali." });
    }

    const hizmet = hizmet_id ? await hizmetGetir(hizmet_id) : null;
    const bosSlotlar = await bosSlotlariGetir(isletmeId, tarih, hizmet?.sure_dakika ?? 30);

    if (bosSlotlar.length === 0) {
      return JSON.stringify({
        musait: false,
        mesaj: `${tarih} tarihinde müsait saat bulunamadı.`,
      });
    }

    return JSON.stringify({
      musait: true,
      tarih,
      bos_saatler: bosSlotlar.map((s) => s.baslangicStr),
    });
  }

  if (toolName === "randevu_olustur") {
    const { musteri_ad, hizmet_id, tarih, saat, notlar } = toolInput as {
      musteri_ad: string;
      hizmet_id: string;
      tarih: string;
      saat: string;
      notlar?: string;
    };

    const hizmet = await hizmetGetir(hizmet_id);
    if (!hizmet) {
      return JSON.stringify({ basari: false, hata: "Hizmet bulunamadı." });
    }

    if (!gecerliTarihMi(tarih) || saatiDakikaya(saat) === null) {
      return JSON.stringify({ basari: false, hata: "Tarih YYYY-MM-DD, saat HH:mm olmalı." });
    }

    // Sadece gerçekten boş olan bir slota randevu yazılır (çalışma saatleri,
    // geçmiş saatler ve diğer randevular dikkate alınır).
    const slotlar = await bosSlotlariGetir(isletmeId, tarih, hizmet.sure_dakika);
    const slot = slotlar.find((s) => saatiDakikaya(s.baslangicStr) === saatiDakikaya(saat));
    if (!slot) {
      return JSON.stringify({
        basari: false,
        hata: "Bu saat müsait değil. Lütfen bos_saat_bak ile boş bir saat seçin.",
      });
    }

    const baslaD = slot.baslangic;
    const bitisD = slot.bitis;

    const { data: yeniRandevu, error } = await supabase
      .from("randevular")
      .insert({
        isletme_id: isletmeId,
        hizmet_id,
        musteri_ad: String(musteri_ad ?? "").slice(0, 100),
        musteri_whatsapp: musteriNo,
        baslangic: baslaD.toISOString(),
        bitis: bitisD.toISOString(),
        notlar: notlar ? String(notlar).slice(0, 500) : null,
        durum: "onaylandi",
      })
      .select()
      .single();

    if (error) {
      return JSON.stringify({ basari: false, hata: "Randevu kaydedilemedi." });
    }

    return JSON.stringify({
      basari: true,
      randevu_id: yeniRandevu.id,
      hizmet: hizmet.ad,
      tarih: yerelTarih(baslaD),
      saat: yerelSaat(baslaD),
      fiyat: hizmet.fiyat,
    });
  }

  if (toolName === "randevu_iptal") {
    const { randevu_id, iptal_nedeni } = toolInput as {
      randevu_id: string;
      iptal_nedeni?: string;
    };

    const { data, error } = await supabase
      .from("randevular")
      .update({
        durum: "iptal",
        notlar: iptal_nedeni ? String(iptal_nedeni).slice(0, 500) : "Müşteri isteği ile iptal",
      })
      .eq("id", randevu_id)
      .eq("isletme_id", isletmeId)
      .eq("musteri_whatsapp", musteriNo)
      .in("durum", AKTIF_DURUMLAR)
      .gt("baslangic", new Date().toISOString())
      .select("id");

    if (error || !data?.length) {
      return JSON.stringify({ basari: false, hata: "Size ait aktif bir randevu bulunamadı." });
    }

    return JSON.stringify({ basari: true, randevu_id });
  }

  if (toolName === "hizmetleri_listele") {
    const { data: hizmetler, error } = await supabase
      .from("hizmetler")
      .select("id, ad, sure_dakika, fiyat")
      .eq("isletme_id", isletmeId)
      .eq("aktif", true)
      .order("fiyat", { ascending: true });

    if (error) return JSON.stringify({ basari: false, hata: "Hizmetler alınamadı." });
    return JSON.stringify({ basari: true, hizmetler: hizmetler ?? [] });
  }

  if (toolName === "randevularim_listele") {
    const { data: randevular, error } = await supabase
      .from("randevular")
      .select(`
        id, baslangic, bitis, durum,
        hizmetler ( ad, fiyat )
      `)
      .eq("musteri_whatsapp", musteriNo)
      .eq("isletme_id", isletmeId)
      .in("durum", AKTIF_DURUMLAR)
      .gt("bitis", new Date().toISOString())
      .order("baslangic", { ascending: true });

    if (error) {
      return JSON.stringify({ basari: false, hata: "Randevular alınamadı." });
    }

    return JSON.stringify({
      basari: true,
      randevular: (randevular ?? []).map((r) => ({
        id: r.id,
        durum: r.durum,
        hizmet: r.hizmetler,
        tarih: yerelTarih(new Date(r.baslangic)),
        saat: yerelSaat(new Date(r.baslangic)),
        bitis_saat: yerelSaat(new Date(r.bitis)),
      })),
    });
  }

  return JSON.stringify({ hata: `Bilinmeyen araç: ${toolName}` });
}

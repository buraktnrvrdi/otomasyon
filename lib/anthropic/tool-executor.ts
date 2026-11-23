import { createServerClient } from "@/lib/supabase/server";
import { bosSlotlariGetir } from "@/lib/utils/slot-calculator";

function yerelTarih(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

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

    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(tarih))) {
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
      slotlar: bosSlotlar.map((s) => ({
        baslangic: s.baslangic.toISOString(),
        baslangicStr: s.baslangicStr,
        bitis: s.bitis.toISOString(),
      })),
    });
  }

  if (toolName === "randevu_olustur") {
    const { musteri_ad, hizmet_id, baslangic, notlar } = toolInput as {
      musteri_ad: string;
      hizmet_id: string;
      baslangic: string;
      notlar?: string;
    };

    const hizmet = await hizmetGetir(hizmet_id);
    if (!hizmet) {
      return JSON.stringify({ basari: false, hata: "Hizmet bulunamadı." });
    }

    const baslaD = new Date(baslangic);
    if (Number.isNaN(baslaD.getTime())) {
      return JSON.stringify({ basari: false, hata: "Geçersiz başlangıç zamanı." });
    }

    // Sadece gerçekten boş olan bir slota randevu yazılır (çalışma saatleri,
    // geçmiş saatler ve diğer randevular dikkate alınır).
    const slotlar = await bosSlotlariGetir(isletmeId, yerelTarih(baslaD), hizmet.sure_dakika);
    if (!slotlar.some((s) => s.baslangic.getTime() === baslaD.getTime())) {
      return JSON.stringify({
        basari: false,
        hata: "Bu saat müsait değil. Lütfen bos_saat_bak ile boş bir saat seçin.",
      });
    }

    const bitisD = new Date(baslaD.getTime() + hizmet.sure_dakika * 60_000);

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
      baslangic: baslaD.toISOString(),
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
      .in("durum", ["beklemede", "onaylandi"])
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
      .in("durum", ["beklemede", "onaylandi"])
      .order("baslangic", { ascending: true });

    if (error) {
      return JSON.stringify({ basari: false, hata: "Randevular alınamadı." });
    }

    return JSON.stringify({ basari: true, randevular: randevular ?? [] });
  }

  return JSON.stringify({ hata: `Bilinmeyen araç: ${toolName}` });
}

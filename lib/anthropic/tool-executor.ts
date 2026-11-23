import { createServerClient } from "@/lib/supabase/server";
import { bosSlotlariGetir } from "@/lib/utils/slot-calculator";

export async function toolCalistir(
  toolName: string,
  toolInput: Record<string, unknown>,
  isletmeId: string
): Promise<string> {
  const supabase = await createServerClient();

  if (toolName === "bos_saat_bak") {
    const { tarih, hizmet_id } = toolInput as {
      tarih: string;
      hizmet_id?: string;
    };

    let hizmetSure = 30;

    if (hizmet_id) {
      const { data: hizmet } = await supabase
        .from("hizmetler")
        .select("sure_dakika")
        .eq("id", hizmet_id)
        .single();
      if (hizmet) hizmetSure = hizmet.sure_dakika;
    }

    const bosSlotlar = await bosSlotlariGetir(isletmeId, tarih, hizmetSure);

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
    const { musteri_ad, musteri_whatsapp, hizmet_id, baslangic, notlar } =
      toolInput as {
        musteri_ad: string;
        musteri_whatsapp: string;
        hizmet_id: string;
        baslangic: string;
        notlar?: string;
      };

    const { data: hizmet } = await supabase
      .from("hizmetler")
      .select("sure_dakika, ad, fiyat")
      .eq("id", hizmet_id)
      .single();

    if (!hizmet) {
      return JSON.stringify({ basari: false, hata: "Hizmet bulunamadı." });
    }

    const baslaD = new Date(baslangic);
    const bitisD = new Date(baslaD.getTime() + hizmet.sure_dakika * 60_000);

    const { data: cakisan } = await supabase
      .from("randevular")
      .select("id")
      .eq("isletme_id", isletmeId)
      .lt("baslangic", bitisD.toISOString())
      .gt("bitis", baslaD.toISOString())
      .in("durum", ["beklemede", "onaylandi"])
      .maybeSingle();

    if (cakisan) {
      return JSON.stringify({
        basari: false,
        hata: "Bu saat az önce başkası tarafından alındı. Lütfen başka bir saat seçin.",
      });
    }

    const { data: yeniRandevu, error } = await supabase
      .from("randevular")
      .insert({
        isletme_id: isletmeId,
        hizmet_id,
        musteri_ad,
        musteri_whatsapp,
        baslangic: baslaD.toISOString(),
        bitis: bitisD.toISOString(),
        notlar,
        durum: "onaylandi",
      })
      .select()
      .single();

    if (error) {
      return JSON.stringify({ basari: false, hata: error.message });
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

    const { error } = await supabase
      .from("randevular")
      .update({
        durum: "iptal",
        notlar: iptal_nedeni ?? "Müşteri isteği ile iptal",
      })
      .eq("id", randevu_id)
      .in("durum", ["beklemede", "onaylandi"]);

    if (error) {
      return JSON.stringify({ basari: false, hata: error.message });
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

    if (error) return JSON.stringify({ basari: false, hata: error.message });
    return JSON.stringify({ basari: true, hizmetler: hizmetler ?? [] });
  }

  if (toolName === "randevularim_listele") {
    const { musteri_whatsapp } = toolInput as { musteri_whatsapp: string };

    const { data: randevular, error } = await supabase
      .from("randevular")
      .select(`
        id, baslangic, bitis, durum,
        hizmetler ( ad, fiyat )
      `)
      .eq("musteri_whatsapp", musteri_whatsapp)
      .eq("isletme_id", isletmeId)
      .in("durum", ["beklemede", "onaylandi"])
      .order("baslangic", { ascending: true });

    if (error) {
      return JSON.stringify({ basari: false, hata: error.message });
    }

    return JSON.stringify({ basari: true, randevular: randevular ?? [] });
  }

  return JSON.stringify({ hata: `Bilinmeyen araç: ${toolName}` });
}

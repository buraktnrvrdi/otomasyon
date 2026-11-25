import { createServerClient } from "@/lib/supabase/server";
import { bosSlotlariGetir } from "@/lib/utils/slot-calculator";
import { gecerliTarihMi, gunEkle, saatiDakikaya, yerelSaat, yerelTarih } from "@/lib/utils/zaman";
import { gunBilgisiGetir } from "@/lib/gun-bilgisi";
import { AKTIF_DURUMLAR, cakismaHatasiMi } from "@/lib/randevu-durum";
import { bildirimiPlanla } from "@/lib/bildirim";

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

  /** Müşterinin kendi, henüz başlamamış aktif randevusu. Başkasının randevusu asla dönmez. */
  const kendiRandevusu = async (randevuId: unknown) => {
    if (typeof randevuId !== "string") return null;
    const { data } = await supabase
      .from("randevular")
      .select("id, musteri_ad, baslangic, bitis, hizmetler ( ad )")
      .eq("id", randevuId)
      .eq("isletme_id", isletmeId)
      .eq("musteri_whatsapp", musteriNo)
      .in("durum", AKTIF_DURUMLAR)
      .gt("baslangic", new Date().toISOString())
      .maybeSingle();
    if (!data) return null;
    const hizmet = data.hizmetler as unknown as { ad: string } | null;
    const baslangic = new Date(data.baslangic);
    const bitis = new Date(data.bitis);
    return {
      id: data.id as string,
      musteriAd: data.musteri_ad as string,
      hizmetAdi: hizmet?.ad ?? "Randevu",
      baslangic,
      sureDakika: Math.round((bitis.getTime() - baslangic.getTime()) / 60_000),
    };
  };

  if (toolName === "bos_saat_bak") {
    const { tarih, hizmet_id, randevu_id } = toolInput as {
      tarih: string;
      hizmet_id?: string;
      randevu_id?: string;
    };

    if (!gecerliTarihMi(tarih)) {
      return JSON.stringify({ musait: false, hata: "Tarih YYYY-MM-DD olmali." });
    }

    const hizmet = hizmet_id ? await hizmetGetir(hizmet_id) : null;
    // Randevu taşınırken: kendi randevusu meşgul sayılmaz, süre de ondan alınır.
    const tasinan = randevu_id ? await kendiRandevusu(randevu_id) : null;
    const sure = tasinan?.sureDakika ?? hizmet?.sure_dakika ?? 30;
    const [bosSlotlar, gun] = await Promise.all([
      bosSlotlariGetir(isletmeId, tarih, sure, tasinan?.id),
      gunBilgisiGetir(isletmeId, tarih),
    ]);

    // Model, listede olmayan bir saati "dolu" sanmasın: nedeni (tatil, kapalı gün, kapanış) açıkça verilir.
    const molalar = gun.molalar.map((m) => ({
      baslangic: `${String(Math.floor(m.bas / 60)).padStart(2, "0")}:${String(m.bas % 60).padStart(2, "0")}`,
      bitis: `${String(Math.floor(m.bit / 60)).padStart(2, "0")}:${String(m.bit % 60).padStart(2, "0")}`,
      aciklama: m.aciklama,
    }));

    if (bosSlotlar.length === 0) {
      const neden = gun.tatil ? "tatil" : !gun.calisma ? "salon_kapali" : "dolu_veya_gecmis";
      return JSON.stringify({
        musait: false,
        neden,
        calisma_saatleri: gun.calisma,
        mola_saatleri: molalar,
        mesaj:
          neden === "tatil"
            ? `Salon ${tarih} tarihinde tatilde/izinde${gun.tatil?.aciklama ? ` (${gun.tatil.aciklama})` : ""}.`
            : neden === "salon_kapali"
              ? `Salon ${tarih} tarihinde kapalı.`
              : `${tarih} tarihinde müsait saat kalmadı (hepsi dolu ya da geçmiş).`,
      });
    }

    return JSON.stringify({
      musait: true,
      tarih,
      calisma_saatleri: gun.calisma,
      mola_saatleri: molalar,
      hizmet_suresi_dakika: sure,
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

    if (cakismaHatasiMi(error)) {
      return JSON.stringify({
        basari: false,
        hata: "Bu saat az önce başkası tarafından alındı. Lütfen başka bir saat seçin.",
      });
    }
    if (error) {
      return JSON.stringify({ basari: false, hata: "Randevu kaydedilemedi." });
    }

    bildirimiPlanla(isletmeId, {
      tur: "yeni",
      musteri: String(musteri_ad ?? ""),
      hizmet: hizmet.ad,
      baslangic: baslaD,
    });

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

    const iptalEdilecek = await kendiRandevusu(randevu_id);

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

    if (iptalEdilecek) {
      bildirimiPlanla(isletmeId, {
        tur: "iptal",
        musteri: iptalEdilecek.musteriAd,
        hizmet: iptalEdilecek.hizmetAdi,
        baslangic: iptalEdilecek.baslangic,
      });
    }

    return JSON.stringify({ basari: true, randevu_id });
  }

  if (toolName === "randevu_tasi") {
    const { randevu_id, tarih, saat } = toolInput as {
      randevu_id: string;
      tarih: string;
      saat: string;
    };

    if (!gecerliTarihMi(tarih) || saatiDakikaya(saat) === null) {
      return JSON.stringify({ basari: false, hata: "Tarih YYYY-MM-DD, saat HH:mm olmalı." });
    }

    const mevcut = await kendiRandevusu(randevu_id);
    if (!mevcut) {
      return JSON.stringify({
        basari: false,
        hata: "Size ait, henüz başlamamış aktif bir randevu bulunamadı.",
      });
    }

    // Aynı hizmet süresiyle, çalışma saatlerine ve diğer randevulara uyan boş bir slot aranır.
    const slotlar = await bosSlotlariGetir(isletmeId, tarih, mevcut.sureDakika, mevcut.id);
    const slot = slotlar.find((s) => saatiDakikaya(s.baslangicStr) === saatiDakikaya(saat));
    if (!slot) {
      return JSON.stringify({
        basari: false,
        hata: "Bu saat müsait değil. Lütfen bos_saat_bak ile (randevu_id vererek) boş bir saat seçin.",
      });
    }

    const { data, error } = await supabase
      .from("randevular")
      .update({
        baslangic: slot.baslangic.toISOString(),
        bitis: slot.bitis.toISOString(),
        // Yeni saat için hatırlatma yeniden gönderilebilsin.
        hatirlatma_gonderildi_at: null,
      })
      .eq("id", mevcut.id)
      .eq("isletme_id", isletmeId)
      .eq("musteri_whatsapp", musteriNo)
      .in("durum", AKTIF_DURUMLAR)
      .select("id");

    if (cakismaHatasiMi(error)) {
      return JSON.stringify({
        basari: false,
        hata: "Bu saat az önce başkası tarafından alındı. Lütfen başka bir saat seçin.",
      });
    }
    if (error || !data?.length) {
      return JSON.stringify({ basari: false, hata: "Randevu değiştirilemedi." });
    }

    bildirimiPlanla(isletmeId, {
      tur: "tasindi",
      musteri: mevcut.musteriAd,
      hizmet: mevcut.hizmetAdi,
      baslangic: slot.baslangic,
      eskiBaslangic: mevcut.baslangic,
    });

    return JSON.stringify({
      basari: true,
      randevu_id: mevcut.id,
      hizmet: mevcut.hizmetAdi,
      eski_tarih: yerelTarih(mevcut.baslangic),
      eski_saat: yerelSaat(mevcut.baslangic),
      tarih: yerelTarih(slot.baslangic),
      saat: yerelSaat(slot.baslangic),
    });
  }

  if (toolName === "salon_bilgisi") {
    const bugun = yerelTarih();
    const [{ data: isletme }, { data: saatler }, { data: tatiller }] = await Promise.all([
      supabase.from("isletme").select("ad, telefon, adres").eq("id", isletmeId).maybeSingle(),
      supabase.from("calisma_saatleri").select("gun, acilis, kapanis, kapali").eq("isletme_id", isletmeId),
      supabase
        .from("kapali_gunler")
        .select("baslangic_tarih, bitis_tarih, baslangic_saat, bitis_saat, aciklama")
        .eq("isletme_id", isletmeId)
        .gte("bitis_tarih", bugun)
        .lte("baslangic_tarih", gunEkle(bugun, 60))
        .order("baslangic_tarih", { ascending: true })
        .limit(10),
    ]);

    const GUNLER = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
    const haftalik = [1, 2, 3, 4, 5, 6, 0].map((gun) => {
      const s = (saatler ?? []).find((x) => x.gun === gun);
      return {
        gun: GUNLER[gun],
        saat: s && !s.kapali ? `${String(s.acilis).slice(0, 5)}-${String(s.kapanis).slice(0, 5)}` : "kapalı",
      };
    });

    return JSON.stringify({
      basari: true,
      ad: isletme?.ad ?? null,
      // Boş alanlar "bilgi girilmemiş" demektir; model bunları uydurmamalı.
      telefon: isletme?.telefon || null,
      adres: isletme?.adres || null,
      calisma_saatleri: haftalik,
      yaklasan_tatiller: (tatiller ?? []).map((t) => ({
        baslangic: t.baslangic_tarih,
        bitis: t.bitis_tarih,
        saat: t.baslangic_saat
          ? `${String(t.baslangic_saat).slice(0, 5)}-${String(t.bitis_saat).slice(0, 5)} arası`
          : "tüm gün",
        aciklama: t.aciklama,
      })),
    });
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

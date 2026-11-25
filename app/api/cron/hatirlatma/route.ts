import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { sablonGonder } from "@/lib/whatsapp/sender";
import { gonderilebilirMi } from "@/lib/whatsapp/kimlik";
import { AKTIF_DURUMLAR, gecmisleriTamamla } from "@/lib/randevu-durum";
import { uzunTarihMetni, yerelSaat } from "@/lib/utils/zaman";
import { eskileriTemizle } from "@/lib/sinirlayici";
import { eskiMesajlariTemizle } from "@/lib/tekrar";
import { uyar } from "@/lib/uyari";

/** Günde bir kez çalışınca ertesi günün akşamına kadar olan randevuları kapsar. */
const PENCERE_SAAT = 36;
/** Çok yakın randevuya hatırlatma gitmez (müşteri zaten yeni almıştır). */
const EN_AZ_DAKIKA = 30;

function yetkili(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  const gelen = req.headers.get("authorization") ?? "";
  const beklenen = `Bearer ${secret}`;
  return (
    !!secret &&
    gelen.length === beklenen.length &&
    timingSafeEqual(Buffer.from(gelen), Buffer.from(beklenen))
  );
}

// Vercel Cron, CRON_SECRET tanımlıysa isteğe "Authorization: Bearer <secret>" ekler.
export async function GET(req: NextRequest) {
  if (!yetkili(req)) return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });

  // Kimse paneli açmasa da durumlar güncel kalsın (tüm işletmeler).
  await gecmisleriTamamla();

  // Hız sınırı ve tekrar kontrolü kayıtları şişmesin.
  await Promise.allSettled([eskileriTemizle(), eskiMesajlariTemizle()]);

  const sablon = process.env.WHATSAPP_HATIRLATMA_SABLONU;
  if (!sablon) {
    return NextResponse.json({ atlandi: "WHATSAPP_HATIRLATMA_SABLONU ayarlanmamis" });
  }

  const simdi = Date.now();
  const supabase = await createServerClient();
  const { data: randevular, error } = await supabase
    .from("randevular")
    .select(`
      id, musteri_ad, musteri_whatsapp, baslangic,
      hizmetler ( ad ),
      isletme ( ad, whatsapp_no, meta_phone_number_id )
    `)
    .in("durum", AKTIF_DURUMLAR)
    .is("hatirlatma_gonderildi_at", null)
    .gt("baslangic", new Date(simdi + EN_AZ_DAKIKA * 60_000).toISOString())
    .lte("baslangic", new Date(simdi + PENCERE_SAAT * 3600_000).toISOString());

  if (error) return NextResponse.json({ hata: error.message }, { status: 500 });

  let gonderilen = 0;
  const hatalar: string[] = [];

  for (const r of (randevular ?? []).filter((x) => gonderilebilirMi(x.musteri_whatsapp))) {
    // Önce işaretle: aynı anda çalışan iki görev aynı müşteriye iki mesaj atmasın.
    const { data: alindi } = await supabase
      .from("randevular")
      .update({ hatirlatma_gonderildi_at: new Date().toISOString() })
      .eq("id", r.id)
      .is("hatirlatma_gonderildi_at", null)
      .select("id");
    if (!alindi?.length) continue;

    const isletme = r.isletme as unknown as {
      ad: string;
      whatsapp_no: string | null;
      meta_phone_number_id: string | null;
    } | null;
    const hizmet = r.hizmetler as unknown as { ad: string } | null;
    const baslangic = new Date(r.baslangic);

    try {
      // Şablon değişkenleri: {{1}} ad, {{2}} salon, {{3}} tarih, {{4}} saat, {{5}} hizmet
      await sablonGonder(
        r.musteri_whatsapp,
        sablon,
        [
          r.musteri_ad,
          isletme?.ad ?? "Salon",
          uzunTarihMetni(baslangic),
          yerelSaat(baslangic),
          hizmet?.ad ?? "Randevu",
        ],
        {
          numara: isletme?.whatsapp_no ?? undefined,
          phoneNumberId: isletme?.meta_phone_number_id ?? undefined,
        }
      );
      gonderilen++;
    } catch (err) {
      // Bir sonraki çalışmada tekrar denensin.
      await supabase.from("randevular").update({ hatirlatma_gonderildi_at: null }).eq("id", r.id);
      hatalar.push(`${r.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (hatalar.length) {
    console.error("[Hatirlatma]", hatalar);
    await uyar(`${hatalar.length} hatırlatma gönderilemedi`, hatalar[0].slice(0, 300), "hatirlatma", 360);
  }
  return NextResponse.json({ aday: randevular?.length ?? 0, gonderilen, hata: hatalar.length });
}

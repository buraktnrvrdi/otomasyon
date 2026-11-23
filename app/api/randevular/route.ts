import { createServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { getIsletmeId } from "@/lib/supabase/auth";
import { gecerliTarihMi, saatiDakikaya, yerelAn } from "@/lib/utils/zaman";
import { cakismaHatasiMi } from "@/lib/randevu-durum";
import { numaraNormalize } from "@/lib/whatsapp/parser";

export async function POST(req: NextRequest) {
  const isletme_id = await getIsletmeId();
  if (!isletme_id) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const supabase = await createServerClient();
  const body = await req.json();
  const { musteri_ad, musteri_whatsapp, hizmet_id, tarih, saat } = body;

  if (!musteri_ad || !musteri_whatsapp || !hizmet_id || !tarih || !saat) {
    return NextResponse.json({ error: "Eksik alan" }, { status: 400 });
  }

  const { data: hizmet, error: hizmetErr } = await supabase
    .from("hizmetler")
    .select("sure_dakika")
    .eq("id", hizmet_id)
    .eq("isletme_id", isletme_id)
    .single();

  if (hizmetErr || !hizmet) {
    return NextResponse.json({ error: "Hizmet bulunamadi" }, { status: 404 });
  }

  const dakika = saatiDakikaya(saat);
  if (!gecerliTarihMi(tarih) || dakika === null) {
    return NextResponse.json({ error: "Gecersiz tarih veya saat" }, { status: 400 });
  }

  const baslangic = yerelAn(tarih, dakika);
  const bitis = new Date(baslangic.getTime() + hizmet.sure_dakika * 60 * 1000);

  const { error } = await supabase.from("randevular").insert({
    isletme_id,
    musteri_ad,
    musteri_whatsapp: numaraNormalize(musteri_whatsapp),
    hizmet_id,
    baslangic: baslangic.toISOString(),
    bitis: bitis.toISOString(),
    durum: "onaylandi",
  });

  if (cakismaHatasiMi(error)) {
    return NextResponse.json({ error: "Bu saatte baska bir randevu var." }, { status: 409 });
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

import { createServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { getIsletmeId } from "@/lib/supabase/auth";
import { gecerliTarihMi, saatiDakikaya, yerelAn } from "@/lib/utils/zaman";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const isletme_id = await getIsletmeId();
  if (!isletme_id) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const supabase = await createServerClient();
  const body = await req.json().catch(() => ({}));

  if (body.tarih || body.saat) {
    const dakika = saatiDakikaya(body.saat);
    if (!gecerliTarihMi(body.tarih) || dakika === null) {
      return NextResponse.json({ error: "Gecersiz tarih veya saat" }, { status: 400 });
    }

    const { data: hizmet } = await supabase
      .from("hizmetler")
      .select("id, sure_dakika")
      .eq("id", body.hizmet_id)
      .eq("isletme_id", isletme_id)
      .maybeSingle();
    if (!hizmet) return NextResponse.json({ error: "Hizmet bulunamadi" }, { status: 404 });

    const baslangic = yerelAn(body.tarih, dakika);
    const bitis = new Date(baslangic.getTime() + hizmet.sure_dakika * 60_000);

    const { error } = await supabase
      .from("randevular")
      .update({
        hizmet_id: hizmet.id,
        baslangic: baslangic.toISOString(),
        bitis: bitis.toISOString(),
      })
      .eq("id", id)
      .eq("isletme_id", isletme_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const { error, data } = await supabase
    .from("randevular")
    .update({ durum: "iptal" })
    .eq("id", id)
    .eq("isletme_id", isletme_id)
    .select("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data?.length) return NextResponse.json({ error: "Randevu bulunamadi" }, { status: 404 });

  return NextResponse.json({ ok: true });
}

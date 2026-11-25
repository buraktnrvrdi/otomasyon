import { NextRequest, NextResponse } from "next/server";
import { getIsletmeId } from "@/lib/supabase/auth";
import { musteriVerisiniSil } from "@/lib/musteri-sil";

/** Müşterinin kişisel verilerini siler / anonimleştirir (KVKK m.7). */
export async function DELETE(req: NextRequest) {
  const isletme_id = await getIsletmeId();
  if (!isletme_id) return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });

  const { musteri_whatsapp } = await req.json().catch(() => ({}));
  if (typeof musteri_whatsapp !== "string") {
    return NextResponse.json({ hata: "Geçersiz istek." }, { status: 400 });
  }

  const sonuc = await musteriVerisiniSil(isletme_id, musteri_whatsapp);
  if (!sonuc.ok) return NextResponse.json({ hata: sonuc.hata }, { status: sonuc.durum });
  return NextResponse.json({ basari: true, anonimlestirilen_randevu: sonuc.anonimlestirilen });
}

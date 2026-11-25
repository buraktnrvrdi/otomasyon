import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getIsletmeId } from "@/lib/supabase/auth";
import { MAKS_NOT } from "@/lib/musteri-notlari";

const TABLO_YOK = ["PGRST205", "42P01"];

/** Müşteri notunu kaydeder; boş not, notu siler. Notu yalnızca salon görür, bot görmez. */
export async function PUT(req: NextRequest) {
  const isletme_id = await getIsletmeId();
  if (!isletme_id) return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });

  const { musteri_whatsapp, notu } = await req.json().catch(() => ({}));
  if (typeof musteri_whatsapp !== "string" || !musteri_whatsapp || musteri_whatsapp.startsWith("silindi-")) {
    return NextResponse.json({ hata: "Geçersiz istek." }, { status: 400 });
  }
  const metin = typeof notu === "string" ? notu.trim() : "";
  if (metin.length > MAKS_NOT) {
    return NextResponse.json({ hata: `Not en fazla ${MAKS_NOT} karakter olabilir.` }, { status: 400 });
  }

  const db = await createServerClient();

  // Not yalnızca bu salonun gerçekten randevusu olan müşterilerine yazılabilir.
  const { count } = await db
    .from("randevular")
    .select("id", { count: "exact", head: true })
    .eq("isletme_id", isletme_id)
    .eq("musteri_whatsapp", musteri_whatsapp);
  if (!count) return NextResponse.json({ hata: "Müşteri bulunamadı." }, { status: 404 });

  const { error } = metin
    ? await db
        .from("musteri_notlari")
        .upsert(
          { isletme_id, musteri_whatsapp, notu: metin, guncellendi_at: new Date().toISOString() },
          { onConflict: "isletme_id,musteri_whatsapp" }
        )
    : await db.from("musteri_notlari").delete().eq("isletme_id", isletme_id).eq("musteri_whatsapp", musteri_whatsapp);

  if (error) {
    if (TABLO_YOK.includes(error.code ?? "")) {
      return NextResponse.json({ hata: "Not tablosu henüz yok. Yöneticiden 011 migration'ını çalıştırmasını iste." }, { status: 503 });
    }
    return NextResponse.json({ hata: "Not kaydedilemedi." }, { status: 500 });
  }
  return NextResponse.json({ basari: true });
}

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { SUPER_COOKIE, oturumGecerliMi } from "@/lib/super-session";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const yetkili = (req: NextRequest) => oturumGecerliMi(req.cookies.get(SUPER_COOKIE)?.value);

/** Okunmamış uyarılar, en yeni olay en üstte. */
export async function GET(req: NextRequest) {
  if (!(await yetkili(req))) return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });

  const db = await createServerClient();
  const { data, error } = await db
    .from("uyarilar")
    .select("id, baslik, detay, adet, son_olusma_at, olusturuldu_at")
    .eq("okundu", false)
    .order("son_olusma_at", { ascending: false })
    .limit(50);

  // Tablo yoksa (migration 008 çalıştırılmadıysa) paneli bozma.
  if (error) {
    console.error("[Super uyarilar]", error.message);
    return NextResponse.json({ uyarilar: [], hazir: false });
  }
  return NextResponse.json({ uyarilar: data ?? [], hazir: true });
}

/** Bir uyarıyı ({ id }) ya da hepsini ({ hepsi: true }) okundu yapar. */
export async function POST(req: NextRequest) {
  if (!(await yetkili(req))) return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });

  const { id, hepsi } = await req.json().catch(() => ({}));
  const db = await createServerClient();

  let sorgu = db.from("uyarilar").update({ okundu: true }).eq("okundu", false);
  if (hepsi === true) {
    // hepsi okundu
  } else if (typeof id === "string" && UUID.test(id)) {
    sorgu = sorgu.eq("id", id);
  } else {
    return NextResponse.json({ hata: "Geçersiz istek." }, { status: 400 });
  }

  const { error } = await sorgu;
  if (error) return NextResponse.json({ hata: "Güncellenemedi." }, { status: 500 });
  return NextResponse.json({ basari: true });
}

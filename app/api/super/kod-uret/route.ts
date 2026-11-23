import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { SUPER_COOKIE, oturumGecerliMi } from "@/lib/super-session";

function rastgeleKod(): string {
  // 32 karakter: bayt % 32 eşit dağılır.
  const karakterler = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const baytlar = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(baytlar, (b) => karakterler[b % 32]).join("");
}

export async function POST(req: NextRequest) {
  if (!(await oturumGecerliMi(req.cookies.get(SUPER_COOKIE)?.value))) {
    return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });
  }

  const db = await createServerClient();

  let kod = "";
  for (let i = 0; i < 5; i++) {
    kod = rastgeleKod();
    const { error } = await db.from("davet_kodlari").insert({ kod });
    if (!error) break;
    kod = "";
  }

  if (!kod) {
    return NextResponse.json({ hata: "Kod olusturulamadi." }, { status: 500 });
  }

  return NextResponse.json({ kod });
}

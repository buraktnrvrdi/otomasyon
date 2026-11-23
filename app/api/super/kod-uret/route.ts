import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

function rastgeleKod(): string {
  const karakterler = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () =>
    karakterler[Math.floor(Math.random() * karakterler.length)]
  ).join("");
}

export async function POST(req: NextRequest) {
  const session = req.cookies.get("super_session")?.value;
  if (session !== process.env.SUPER_ADMIN_PASSWORD) {
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

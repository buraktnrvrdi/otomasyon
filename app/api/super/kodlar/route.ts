import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("super_session")?.value;
  if (session !== process.env.SUPER_ADMIN_PASSWORD) {
    return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });
  }

  const db = await createServerClient();
  const { data } = await db
    .from("davet_kodlari")
    .select("*")
    .order("olusturuldu_at", { ascending: false });

  return NextResponse.json(data ?? []);
}

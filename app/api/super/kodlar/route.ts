import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { SUPER_COOKIE, oturumGecerliMi } from "@/lib/super-session";

export async function GET(req: NextRequest) {
  if (!(await oturumGecerliMi(req.cookies.get(SUPER_COOKIE)?.value))) {
    return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });
  }

  const db = await createServerClient();
  const { data } = await db
    .from("davet_kodlari")
    .select("*")
    .order("olusturuldu_at", { ascending: false });

  return NextResponse.json(data ?? []);
}

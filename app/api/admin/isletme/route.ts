import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getIsletmeIdFromReq } from "@/lib/supabase/auth";

export async function GET(req: NextRequest) {
  const isletme_id = getIsletmeIdFromReq(req);
  if (!isletme_id) return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("isletme")
    .select("*")
    .eq("id", isletme_id)
    .single();

  if (error?.code === "PGRST116") return NextResponse.json({ hata: "Isletme bulunamadi. Lutfen tekrar giris yapin." }, { status: 404 });
  if (error) return NextResponse.json({ hata: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const isletme_id = getIsletmeIdFromReq(req);
  if (!isletme_id) return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });

  const supabase = await createServerClient();
  const body = await req.json();

  const { error } = await supabase
    .from("isletme")
    .update({ ad: body.ad, telefon: body.telefon, adres: body.adres, ikon: body.ikon })
    .eq("id", isletme_id);

  if (error) return NextResponse.json({ hata: error.message }, { status: 500 });
  return NextResponse.json({ basari: true });
}

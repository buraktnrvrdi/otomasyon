import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getIsletmeId } from "@/lib/supabase/auth";
import { numaraNormalize } from "@/lib/whatsapp/parser";
import { ikonGecerliMi } from "@/lib/isletme-ikon";

export async function GET(req: NextRequest) {
  const isletme_id = await getIsletmeId();
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
  const isletme_id = await getIsletmeId();
  if (!isletme_id) return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });

  const supabase = await createServerClient();
  const body = await req.json();

  if (body.ikon !== undefined && !ikonGecerliMi(body.ikon)) {
    return NextResponse.json({ hata: "Gecersiz simge." }, { status: 400 });
  }

  const whatsapp_no = numaraNormalize(body.whatsapp_no ?? "") || null;

  const { error } = await supabase
    .from("isletme")
    .update({ ad: body.ad, telefon: body.telefon, adres: body.adres, ikon: body.ikon, whatsapp_no })
    .eq("id", isletme_id);

  if (error?.code === "23505") {
    return NextResponse.json({ hata: "Bu WhatsApp numarasi baska bir isletmeye kayitli." }, { status: 409 });
  }
  if (error) return NextResponse.json({ hata: error.message }, { status: 500 });
  return NextResponse.json({ basari: true });
}

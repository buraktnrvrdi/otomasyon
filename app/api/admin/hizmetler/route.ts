import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getIsletmeIdFromReq } from "@/lib/supabase/auth";

export async function GET(req: NextRequest) {
  const isletme_id = getIsletmeIdFromReq(req);
  if (!isletme_id) return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("hizmetler")
    .select("*")
    .eq("isletme_id", isletme_id)
    .order("fiyat", { ascending: true });

  if (error) return NextResponse.json({ hata: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const isletme_id = getIsletmeIdFromReq(req);
  if (!isletme_id) return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });

  const supabase = await createServerClient();
  const body = await req.json();

  const { data, error } = await supabase
    .from("hizmetler")
    .insert({ ...body, isletme_id })
    .select()
    .single();

  if (error) return NextResponse.json({ hata: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const isletme_id = getIsletmeIdFromReq(req);
  if (!isletme_id) return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });

  const supabase = await createServerClient();
  const { id, ...body } = await req.json();

  const { error } = await supabase
    .from("hizmetler")
    .update(body)
    .eq("id", id)
    .eq("isletme_id", isletme_id);

  if (error) return NextResponse.json({ hata: error.message }, { status: 500 });
  return NextResponse.json({ basari: true });
}

export async function DELETE(req: NextRequest) {
  const isletme_id = getIsletmeIdFromReq(req);
  if (!isletme_id) return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });

  const supabase = await createServerClient();
  const { id } = await req.json();

  const { error } = await supabase
    .from("hizmetler")
    .delete()
    .eq("id", id)
    .eq("isletme_id", isletme_id);

  if (error) return NextResponse.json({ hata: error.message }, { status: 500 });
  return NextResponse.json({ basari: true });
}

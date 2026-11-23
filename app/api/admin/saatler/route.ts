import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getIsletmeIdFromReq } from "@/lib/supabase/auth";

export async function GET(req: NextRequest) {
  const isletme_id = getIsletmeIdFromReq(req);
  if (!isletme_id) return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("calisma_saatleri")
    .select("*")
    .eq("isletme_id", isletme_id)
    .order("gun", { ascending: true });

  if (error) return NextResponse.json({ hata: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function PATCH(req: NextRequest) {
  const isletme_id = getIsletmeIdFromReq(req);
  if (!isletme_id) return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });

  const supabase = await createServerClient();
  const { id, acilis, kapanis, kapali } = await req.json();

  const { error } = await supabase
    .from("calisma_saatleri")
    .update({ acilis, kapanis, kapali })
    .eq("id", id)
    .eq("isletme_id", isletme_id);

  if (error) return NextResponse.json({ hata: error.message }, { status: 500 });
  return NextResponse.json({ basari: true });
}

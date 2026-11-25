import { NextRequest, NextResponse } from "next/server";
import { oturumIstemcisi } from "@/lib/supabase/oturum-istemcisi";

export async function POST(req: NextRequest) {
  const { sifre } = await req.json().catch(() => ({}));
  if (typeof sifre !== "string" || sifre.length < 8 || sifre.length > 72) {
    return NextResponse.json({ hata: "Şifre 8 ile 72 karakter arasında olmalı." }, { status: 400 });
  }

  const { supabase, cerezleriYaz } = oturumIstemcisi(req);
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return NextResponse.json(
      { hata: "Bağlantının süresi dolmuş. Şifre sıfırlamayı yeniden başlat." },
      { status: 401 }
    );
  }

  const { error } = await supabase.auth.updateUser({ password: sifre });
  if (error) {
    const ayni = /different|same/i.test(error.message);
    return NextResponse.json(
      { hata: ayni ? "Yeni şifre eskisinden farklı olmalı." : "Şifre güncellenemedi." },
      { status: 400 }
    );
  }
  return cerezleriYaz(NextResponse.json({ basari: true }));
}

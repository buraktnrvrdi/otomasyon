import { NextRequest, NextResponse } from "next/server";
import {
  SUPER_COOKIE,
  SUPER_OTURUM_SN,
  oturumOlustur,
  sifreDogruMu,
  superAdminAyarliMi,
} from "@/lib/super-session";

export async function POST(req: NextRequest) {
  if (!superAdminAyarliMi()) {
    return NextResponse.json(
      { hata: "SUPER_ADMIN_PASSWORD ayarlanmamis (en az 12 karakter)." },
      { status: 503 }
    );
  }

  const { sifre } = await req.json().catch(() => ({}));

  if (!(await sifreDogruMu(sifre))) {
    // Kaba kuvvet denemelerini yavaşlatır.
    await new Promise((r) => setTimeout(r, 1000));
    return NextResponse.json({ hata: "Sifre yanlis." }, { status: 401 });
  }

  const res = NextResponse.json({ basari: true });
  res.cookies.set(SUPER_COOKIE, await oturumOlustur(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SUPER_OTURUM_SN,
  });
  return res;
}

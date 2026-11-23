import { NextRequest, NextResponse } from "next/server";
import {
  SUPER_COOKIE,
  SUPER_OTURUM_SN,
  oturumOlustur,
  sifreDogruMu,
  superAdminAyarliMi,
} from "@/lib/super-session";
import { basariliGiris, basarisizKaydet, istemciIp, kilitliMi } from "@/lib/giris-sinirlayici";

export async function POST(req: NextRequest) {
  if (!superAdminAyarliMi()) {
    return NextResponse.json(
      { hata: "SUPER_ADMIN_PASSWORD ayarlanmamis (en az 12 karakter)." },
      { status: 503 }
    );
  }

  const ip = istemciIp(req.headers);
  if (await kilitliMi(ip)) {
    return NextResponse.json(
      { hata: "Cok fazla hatali deneme. 15 dakika sonra tekrar deneyin." },
      { status: 429 }
    );
  }

  const { sifre } = await req.json().catch(() => ({}));

  if (!(await sifreDogruMu(sifre))) {
    await basarisizKaydet(ip);
    // Kaba kuvvet denemelerini yavaşlatır.
    await new Promise((r) => setTimeout(r, 1000));
    return NextResponse.json({ hata: "Sifre yanlis." }, { status: 401 });
  }

  await basariliGiris(ip);

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

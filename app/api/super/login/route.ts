import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { sifre } = await req.json();

  if (sifre !== process.env.SUPER_ADMIN_PASSWORD) {
    return NextResponse.json({ hata: "Sifre yanlis." }, { status: 401 });
  }

  const res = NextResponse.json({ basari: true });
  res.cookies.set("super_session", process.env.SUPER_ADMIN_PASSWORD!, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

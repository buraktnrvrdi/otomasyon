import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { DAKIKA, asildiMi, istemciIp, kaydet, temizle } from "@/lib/sinirlayici";

const IP_KURALI = [{ pencereMs: 15 * DAKIKA, sinir: 30 }];
const HESAP_KURALI = [{ pencereMs: 15 * DAKIKA, sinir: 5 }];

export async function POST(req: NextRequest) {
  const { email, sifre } = await req.json();

  if (!email || !sifre) {
    return NextResponse.json({ hata: "Email ve sifre gerekli." }, { status: 400 });
  }

  // Başarısız denemeler IP ve (IP + e-posta) başına sayılır. Sadece e-postaya bakılsaydı
  // biri başkasının hesabını sürekli kilitleyebilirdi.
  const ip = istemciIp(req.headers);
  const ipAnahtari = `admin-ip:${ip}`;
  const hesapAnahtari = `admin-hesap:${ip}:${String(email).trim().toLowerCase()}`;
  if ((await asildiMi(ipAnahtari, IP_KURALI)) || (await asildiMi(hesapAnahtari, HESAP_KURALI))) {
    return NextResponse.json(
      { hata: "Çok fazla hatalı deneme. 15 dakika sonra tekrar deneyin." },
      { status: 429 }
    );
  }

  const cookiesToSet: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(c) { cookiesToSet.push(...c); },
      },
    }
  );

  const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password: sifre });

  if (error || !authData.user) {
    await kaydet(ipAnahtari, hesapAnahtari);
    return NextResponse.json({ hata: "Email veya sifre hatali." }, { status: 401 });
  }

  await temizle(hesapAnahtari);
  const response = NextResponse.json({ basari: true });
  cookiesToSet.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
  );
  return response;
}

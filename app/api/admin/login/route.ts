import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { email, sifre } = await req.json();

  if (!email || !sifre) {
    return NextResponse.json({ hata: "Email ve sifre gerekli." }, { status: 400 });
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
    return NextResponse.json({ hata: "Email veya sifre hatali." }, { status: 401 });
  }

  const response = NextResponse.json({ basari: true });
  cookiesToSet.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
  );
  return response;
}

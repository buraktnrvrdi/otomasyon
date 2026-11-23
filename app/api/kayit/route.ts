import { createServerClient as _createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { davet_kodu, email, sifre, isletme_adi } = await req.json();

  if (!davet_kodu || !email || !sifre || !isletme_adi) {
    return NextResponse.json({ hata: "Tum alanlar gerekli." }, { status: 400 });
  }

  const db = await createServerClient();

  if (typeof sifre !== "string" || sifre.length < 8) {
    return NextResponse.json({ hata: "Sifre en az 8 karakter olmali." }, { status: 400 });
  }

  // Kodu tek sorguda "kullanildi" yap: ayni anda gelen iki kayit ayni kodu alamaz.
  const { data: kod } = await db
    .from("davet_kodlari")
    .update({ kullanildi: true })
    .eq("kod", String(davet_kodu).trim().toUpperCase())
    .eq("kullanildi", false)
    .select("id")
    .maybeSingle();

  if (!kod) {
    return NextResponse.json({ hata: "Gecersiz veya kullanilmis davet kodu." }, { status: 400 });
  }

  const koduGeriAc = () =>
    db.from("davet_kodlari").update({ kullanildi: false }).eq("id", kod.id);

  // Supabase auth kullanici olustur (email dogrulama atla)
  const { data: authData, error: authError } = await db.auth.admin.createUser({
    email,
    password: sifre,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    await koduGeriAc();
    const mesaj = authError?.message?.includes("already registered")
      ? "Bu email adresi zaten kayitli."
      : (authError?.message ?? "Hesap olusturulamadi.");
    return NextResponse.json({ hata: mesaj }, { status: 400 });
  }

  const userId = authData.user.id;

  // Isletme kaydı olustur
  const { data: isletme, error: isletmeError } = await db
    .from("isletme")
    .insert({ ad: isletme_adi, user_id: userId })
    .select("id")
    .single();

  if (isletmeError || !isletme) {
    await db.auth.admin.deleteUser(userId);
    await koduGeriAc();
    return NextResponse.json({ hata: "Isletme kaydedilemedi." }, { status: 500 });
  }

  // Varsayilan calisma saatleri (Pazar kapali, diger gunler 09:00-18:00)
  const saatler = Array.from({ length: 7 }, (_, i) => ({
    isletme_id: isletme.id,
    gun: i,
    acilis: "09:00",
    kapanis: "18:00",
    kapali: i === 0,
  }));
  await db.from("calisma_saatleri").insert(saatler);

  // Otomatik giris yap
  const cookiesToSet: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];
  const authClient = _createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(c) { cookiesToSet.push(...c); },
      },
    }
  );

  await authClient.auth.signInWithPassword({ email, password: sifre });

  const response = NextResponse.json({ basari: true });
  cookiesToSet.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
  );
  return response;
}

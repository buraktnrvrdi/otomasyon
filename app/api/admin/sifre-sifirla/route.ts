import { NextRequest, NextResponse } from "next/server";
import { oturumIstemcisi, siteUrl } from "@/lib/supabase/oturum-istemcisi";
import { SAAT, hakKullan, istemciIp } from "@/lib/sinirlayici";
import { uyar } from "@/lib/uyari";

/**
 * Şifre sıfırlama e-postası gönderir. Hesap var mı yok mu belli olmasın diye
 * her durumda aynı cevap döner.
 */
export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({}));
  if (typeof email !== "string" || !email.includes("@") || email.length > 254) {
    return NextResponse.json({ hata: "Geçerli bir e-posta adresi girin." }, { status: 400 });
  }
  const mail = email.trim().toLowerCase();

  const izinli =
    (await hakKullan(`sifre-ip:${istemciIp(req.headers)}`, [{ pencereMs: SAAT, sinir: 5 }])) &&
    (await hakKullan(`sifre-mail:${mail}`, [{ pencereMs: SAAT, sinir: 3 }]));
  if (!izinli) {
    return NextResponse.json(
      { hata: "Çok fazla istek gönderdiniz. Bir saat sonra tekrar deneyin." },
      { status: 429 }
    );
  }

  const { supabase, cerezleriYaz } = oturumIstemcisi(req);
  const { error } = await supabase.auth.resetPasswordForEmail(mail, {
    redirectTo: `${siteUrl(req)}/api/admin/sifre-callback`,
  });
  if (error) {
    // Genelde e-posta (SMTP) ayarı eksik ya da Supabase'in saatlik e-posta sınırı dolmuştur.
    await uyar("Şifre sıfırlama e-postası gönderilemedi", error.message, "sifre-sifirla", 60);
  }

  return cerezleriYaz(NextResponse.json({ basari: true }));
}

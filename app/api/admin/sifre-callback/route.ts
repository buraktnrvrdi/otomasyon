import { NextRequest, NextResponse } from "next/server";
import { oturumIstemcisi } from "@/lib/supabase/oturum-istemcisi";

/**
 * E-postadaki sıfırlama bağlantısının indiği adres. Bağlantıyı doğrular, kısa
 * süreli oturum açar ve yeni şifre sayfasına yönlendirir.
 *  - token_hash: e-posta şablonu özelleştirildiyse (her cihazda çalışır)
 *  - code: varsayılan akış (bağlantı, isteğin yapıldığı tarayıcıda açılmalı)
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const tokenHash = q.get("token_hash");
  const code = q.get("code");
  const { supabase, cerezleriYaz } = oturumIstemcisi(req);

  let basarili = false;
  if (tokenHash && q.get("type") === "recovery") {
    basarili = !(await supabase.auth.verifyOtp({ type: "recovery", token_hash: tokenHash })).error;
  } else if (code) {
    basarili = !(await supabase.auth.exchangeCodeForSession(code)).error;
  }

  const hedef = basarili ? "/admin/yeni-sifre" : "/admin/sifremi-unuttum?hata=1";
  return cerezleriYaz(NextResponse.redirect(new URL(hedef, req.url)));
}

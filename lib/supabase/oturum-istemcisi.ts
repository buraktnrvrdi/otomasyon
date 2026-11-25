import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

type CerezSecenekleri = Parameters<NextResponse["cookies"]["set"]>[2];
type Cerez = { name: string; value: string; options: CerezSecenekleri };

/**
 * İstekteki çerezlerle çalışan, anon anahtarlı Supabase istemcisi. Oturum
 * değişirse yeni çerezler `cerezleriYaz` ile yanıta eklenmelidir.
 */
export function oturumIstemcisi(req: NextRequest) {
  const yazilacak: Cerez[] = [];
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(c) {
          yazilacak.push(...(c as Cerez[]));
        },
      },
    }
  );
  const cerezleriYaz = <T extends NextResponse>(res: T): T => {
    yazilacak.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
    return res;
  };
  return { supabase, cerezleriYaz };
}

/** Şifre sıfırlama bağlantısının dönüş adresi için site kökü. */
export function siteUrl(req: NextRequest): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin).replace(/\/$/, "");
}

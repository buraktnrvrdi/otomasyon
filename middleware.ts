import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Super admin
  if (pathname.startsWith("/super/login")) return NextResponse.next();
  if (pathname.startsWith("/super")) {
    const session = req.cookies.get("super_session")?.value;
    if (session !== process.env.SUPER_ADMIN_PASSWORD) {
      return NextResponse.redirect(new URL("/super/login", req.url));
    }
    return NextResponse.next();
  }

  // Kayit ve admin login - herkese acik
  if (pathname === "/kayit" || pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  // Admin ve dashboard - Supabase Auth gerektiriyor
  let supabaseResponse = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  // isletme_id cookie yoksa service role ile cek ve set et
  if (!req.cookies.get("isletme_id")?.value) {
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: isletme } = await db
      .from("isletme")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (isletme?.id) {
      supabaseResponse.cookies.set("isletme_id", isletme.id, {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        sameSite: "lax",
      });
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard", "/dashboard/:path*", "/super/:path*"],
};

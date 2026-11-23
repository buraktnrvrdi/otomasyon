import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { SUPER_COOKIE, oturumGecerliMi } from "@/lib/super-session";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Super admin
  if (pathname.startsWith("/super/login")) return NextResponse.next();
  if (pathname.startsWith("/super")) {
    if (!(await oturumGecerliMi(req.cookies.get(SUPER_COOKIE)?.value))) {
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

  return supabaseResponse;
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard", "/dashboard/:path*", "/super/:path*"],
};

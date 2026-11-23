import { createServerClient as _createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export async function createAuthClient() {
  const cookieStore = await cookies();
  return _createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}

// Server component'lerde kullan
export async function getIsletmeId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("isletme_id")?.value ?? null;
}

// Route handler'larda kullan (login'de set edilen cookie'den okur)
export function getIsletmeIdFromReq(req: NextRequest): string | null {
  return req.cookies.get("isletme_id")?.value ?? null;
}


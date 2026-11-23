import { createServerClient as _createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createServerClient } from "./server";

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

/**
 * Giriş yapmış kullanıcının işletmesi. İstemcinin gönderdiği bir değere
 * (cookie, body) asla güvenilmez; her istekte oturum Supabase'de doğrulanır.
 */
export async function getIsletmeId(): Promise<string | null> {
  const auth = await createAuthClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return null;

  const db = await createServerClient();
  const { data } = await db
    .from("isletme")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  return data?.id ?? null;
}

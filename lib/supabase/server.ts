import { createClient } from "@supabase/supabase-js";

/**
 * Sunucu tarafı veritabanı istemcisi (service role). Bilerek cookie okumaz:
 * cookie'de bir kullanıcı oturumu bulursa supabase-js service role anahtarı
 * yerine o kullanıcının token'ını kullanır ve RLS'e takılır. Kullanıcı
 * kimliği için lib/supabase/auth.ts kullanılır.
 */
export async function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    }
  );
}

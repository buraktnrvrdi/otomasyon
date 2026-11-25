import { createServerClient } from "@/lib/supabase/server";

/**
 * Aynı WhatsApp mesajı (aynı kimlik) ikinci kez gelirse false döner. Meta,
 * zamanında 200 alamazsa mesajı tekrar gönderir; bu kontrol çift cevabı ve
 * çift randevuyu engeller. Tablo yoksa ya da veritabanı hata verirse
 * mesajı kaçırmamak için true döner.
 */
export async function ilkKezMi(mesajId: string | undefined): Promise<boolean> {
  if (!mesajId) return true;
  try {
    const supabase = await createServerClient();
    const { error } = await supabase.from("islenen_mesajlar").insert({ mesaj_id: mesajId });
    if (!error) return true;
    if (error.code === "23505") return false; // unique_violation: daha önce işlendi
    console.error("[Tekrar kontrol]", error.message);
  } catch (err) {
    console.error("[Tekrar kontrol]", err instanceof Error ? err.message : err);
  }
  return true;
}

export async function eskiMesajlariTemizle(): Promise<void> {
  const supabase = await createServerClient();
  await supabase
    .from("islenen_mesajlar")
    .delete()
    .lt("olusturuldu_at", new Date(Date.now() - 3 * 24 * 3600_000).toISOString());
}

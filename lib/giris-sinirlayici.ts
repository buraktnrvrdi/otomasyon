import { createServerClient } from "@/lib/supabase/server";

const PENCERE_MS = 15 * 60 * 1000;
const IP_BASINA_SINIR = 5;
const TOPLAM_SINIR = 50;
const TOPLAM = "super:*";

export function istemciIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    headers.get("x-real-ip") ||
    "bilinmiyor"
  );
}

async function sayi(anahtar: string): Promise<number> {
  const supabase = await createServerClient();
  const { count, error } = await supabase
    .from("giris_denemeleri")
    .select("id", { count: "exact", head: true })
    .eq("anahtar", anahtar)
    .gt("zaman", new Date(Date.now() - PENCERE_MS).toISOString());
  // Tablo yoksa (migration çalıştırılmadıysa) girişi tamamen kilitlemek yerine sınırı atla.
  if (error) {
    console.error("[Giris sinirlayici]", error.message);
    return 0;
  }
  return count ?? 0;
}

export async function kilitliMi(ip: string): Promise<boolean> {
  const [ipSayi, toplamSayi] = await Promise.all([sayi(`super:${ip}`), sayi(TOPLAM)]);
  return ipSayi >= IP_BASINA_SINIR || toplamSayi >= TOPLAM_SINIR;
}

export async function basarisizKaydet(ip: string): Promise<void> {
  const supabase = await createServerClient();
  await supabase.from("giris_denemeleri").insert([{ anahtar: `super:${ip}` }, { anahtar: TOPLAM }]);
  await supabase
    .from("giris_denemeleri")
    .delete()
    .lt("zaman", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
}

export async function basariliGiris(ip: string): Promise<void> {
  const supabase = await createServerClient();
  await supabase.from("giris_denemeleri").delete().eq("anahtar", `super:${ip}`);
}

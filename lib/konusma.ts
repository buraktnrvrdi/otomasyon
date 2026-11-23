import { createServerClient } from "@/lib/supabase/server";

const SAKLANAN_MESAJ = 20;

export async function konusmaGetir<T>(isletmeId: string, musteriNo: string): Promise<T[]> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("konusmalar")
    .select("mesajlar")
    .eq("isletme_id", isletmeId)
    .eq("musteri_no", musteriNo)
    .maybeSingle();
  return (data?.mesajlar as T[]) ?? [];
}

/**
 * Son mesajları saklar; kırpılan geçmiş bir kullanıcı mesajıyla başlamalı,
 * yoksa araç çağrısı/cevabı yarım kalır ve model API'si isteği reddeder.
 */
export async function konusmaKaydet<T>(
  isletmeId: string,
  musteriNo: string,
  mesajlar: T[],
  kullaniciMesajiMi: (m: T) => boolean
) {
  let kirpilmis = mesajlar.slice(-SAKLANAN_MESAJ);
  const ilk = kirpilmis.findIndex(kullaniciMesajiMi);
  kirpilmis = ilk === -1 ? [] : kirpilmis.slice(ilk);

  const supabase = await createServerClient();
  const { error } = await supabase.from("konusmalar").upsert(
    {
      isletme_id: isletmeId,
      musteri_no: musteriNo,
      mesajlar: kirpilmis,
      guncellendi_at: new Date().toISOString(),
    },
    { onConflict: "isletme_id,musteri_no" }
  );
  if (error) console.error("[Konusma kaydet]", error.message);
}

export async function isletmeAdi(isletmeId: string): Promise<string> {
  const supabase = await createServerClient();
  const { data } = await supabase.from("isletme").select("ad").eq("id", isletmeId).maybeSingle();
  return data?.ad ?? "Kuaför";
}

export function bugunIstanbul(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" });
}

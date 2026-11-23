import { createServerClient } from "@/lib/supabase/server";

const SAKLANAN_MESAJ = 20;
/** Bu süreden uzun sessizlikten sonra sohbet sıfırdan başlar ("yarın" gibi eski bağlamlar karışmasın). */
const ZAMAN_ASIMI_MS = 12 * 60 * 60 * 1000;

interface KayitliKonusma<T> {
  saglayici: string;
  liste: T[];
}

/**
 * Geçmiş, yazıldığı sağlayıcının mesaj biçimindedir; başka sağlayıcıya ait ya
 * da zaman aşımına uğramış geçmiş yok sayılır.
 */
export async function konusmaGetir<T>(
  isletmeId: string,
  musteriNo: string,
  saglayici: string
): Promise<T[]> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("konusmalar")
    .select("mesajlar, guncellendi_at")
    .eq("isletme_id", isletmeId)
    .eq("musteri_no", musteriNo)
    .maybeSingle();

  if (!data) return [];
  if (Date.now() - new Date(data.guncellendi_at).getTime() > ZAMAN_ASIMI_MS) return [];

  const kayit = data.mesajlar as KayitliKonusma<T> | null;
  return kayit?.saglayici === saglayici && Array.isArray(kayit.liste) ? kayit.liste : [];
}

/**
 * Son mesajları saklar; kırpılan geçmiş bir kullanıcı mesajıyla başlamalı,
 * yoksa araç çağrısı/cevabı yarım kalır ve model API'si isteği reddeder.
 */
export async function konusmaKaydet<T>(
  isletmeId: string,
  musteriNo: string,
  saglayici: string,
  mesajlar: T[],
  kullaniciMesajiMi: (m: T) => boolean
) {
  let kirpilmis = mesajlar.slice(-SAKLANAN_MESAJ);
  const ilk = kirpilmis.findIndex(kullaniciMesajiMi);
  kirpilmis = ilk === -1 ? [] : kirpilmis.slice(ilk);

  const kayit: KayitliKonusma<T> = { saglayici, liste: kirpilmis };
  const supabase = await createServerClient();
  const { error } = await supabase.from("konusmalar").upsert(
    {
      isletme_id: isletmeId,
      musteri_no: musteriNo,
      mesajlar: kayit,
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

/** Müşteri aydınlatma metni adresi. Botun ilk mesajında ve web sohbetinde paylaşılır. */
export function siteTabani(): string {
  const aciklama = process.env.NEXT_PUBLIC_SITE_URL;
  if (aciklama) return aciklama.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return vercel ? `https://${vercel}` : "";
}

export function aydinlatmaAdresi(isletmeId: string): string {
  return `${siteTabani()}/gizlilik/${isletmeId}`;
}

/** Konuşmanın başında bir kez eklenen kısa bilgilendirme. */
export function aydinlatmaNotu(isletmeId: string): string {
  const adres = siteTabani() ? aydinlatmaAdresi(isletmeId) : "";
  return (
    "Randevu için adınız ve telefon numaranız kaydedilir, mesajlarınız otomatik asistan tarafından yanıtlanır." +
    (adres ? ` Kişisel verilerinizin işlenmesi hakkında bilgi: ${adres}` : "")
  );
}

/** Silinen müşterilerin kayıtlarında kullanılan yer tutucu. */
export const SILINMIS_ON_EK = "silindi-";
export const SILINMIS_AD = "Silinmiş müşteri";

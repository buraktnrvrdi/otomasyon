import { DAKIKA, GUN, asildiMi, hakKullan, type Kural } from "@/lib/sinirlayici";

/** Bir müşteri (ya da web'de bir IP) botu kısa sürede boğamasın; her mesaj ücretli bir model çağrısıdır. */
const KISI_KURALLARI: Kural[] = [
  { pencereMs: 10 * DAKIKA, sinir: 20 },
  { pencereMs: GUN, sinir: 120 },
];

const WEB_KURALLARI: Kural[] = [
  { pencereMs: 10 * DAKIKA, sinir: 30 },
  { pencereMs: GUN, sinir: 200 },
];

/** Bir salonun toplam günlük bot mesajı; beklenmedik bir saldırıda faturayı sınırlar. */
const salonKurali = (): Kural[] => [
  { pencereMs: GUN, sinir: Number(process.env.BOT_SALON_GUNLUK_SINIR) || 1500 },
];

export type BotHakki = "tamam" | "kisi" | "salon";

/** Hak varsa kaydeder. kaynak: WhatsApp'ta müşteri kimliği, web'de IP. */
export async function botHakki(
  isletmeId: string,
  kaynak: string,
  web = false
): Promise<BotHakki> {
  if (!(await hakKullan(`bot:${isletmeId}:${kaynak}`, web ? WEB_KURALLARI : KISI_KURALLARI))) {
    return "kisi";
  }
  if (!(await hakKullan(`bot-salon:${isletmeId}`, salonKurali()))) return "salon";
  return "tamam";
}

/** Sınır uyarısı (müşteriye) her kaynak için 10 dakikada bir kez gönderilir; döngüye girmesin. */
export async function uyariGonderilsinMi(isletmeId: string, kaynak: string): Promise<boolean> {
  const anahtar = `bot-uyari:${isletmeId}:${kaynak}`;
  if (await asildiMi(anahtar, [{ pencereMs: 10 * DAKIKA, sinir: 1 }])) return false;
  return hakKullan(anahtar, [{ pencereMs: 10 * DAKIKA, sinir: 1 }]);
}

export const SINIR_MESAJI =
  "Kısa sürede çok fazla mesaj gönderdiniz. Lütfen birkaç dakika sonra tekrar yazın.";
export const YOGUN_MESAJI =
  "Şu an çok yoğunuz ve otomatik asistan geçici olarak yanıt veremiyor. Lütfen salonu arayarak randevu alın.";
export const HATA_MESAJI =
  "Şu an yanıt veremiyorum. Lütfen birkaç dakika sonra tekrar yazın.";

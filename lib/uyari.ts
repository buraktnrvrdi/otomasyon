import { DAKIKA, hakKullan } from "@/lib/sinirlayici";

/**
 * Kritik hataları yöneticiye bildirir. Kanallar isteğe bağlıdır; hiçbiri
 * ayarlı değilse sadece loga yazılır. Bildirim hiçbir zaman hata fırlatmaz ve
 * aynı konu için `aralikDk` içinde en fazla bir kez gönderilir (mesaj yağmuru olmasın).
 * Telefon numarası, token gibi gizli bilgileri `detay` içine koyma.
 *
 *  - UYARI_WEBHOOK_URL: Slack / Discord / benzeri gelen-webhook adresi
 *  - TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID: Telegram botu
 */
export async function uyar(baslik: string, detay = "", konu = baslik, aralikDk = 15): Promise<void> {
  console.error(`[UYARI] ${baslik}${detay ? ` | ${detay.slice(0, 300)}` : ""}`);

  const webhook = process.env.UYARI_WEBHOOK_URL;
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramSohbet = process.env.TELEGRAM_CHAT_ID;
  if (!webhook && !(telegramToken && telegramSohbet)) return;

  if (!(await hakKullan(`uyari:${konu}`, [{ pencereMs: aralikDk * DAKIKA, sinir: 1 }]))) return;

  const metin = `Randevu botu uyarısı: ${baslik}${detay ? `\n${detay.slice(0, 500)}` : ""}`;
  const gonder = (url: string, govde: unknown) =>
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(govde),
      signal: AbortSignal.timeout(5000),
    });

  await Promise.allSettled([
    // Slack "text", Discord "content" alanını okur; diğerini yok sayar.
    webhook ? gonder(webhook, { text: metin, content: metin }) : Promise.resolve(),
    telegramToken && telegramSohbet
      ? gonder(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
          chat_id: telegramSohbet,
          text: metin,
        })
      : Promise.resolve(),
  ]);
}

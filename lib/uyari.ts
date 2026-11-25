import { createServerClient } from "@/lib/supabase/server";
import { DAKIKA, hakKullan } from "@/lib/sinirlayici";

/**
 * Kritik hataları yöneticiye bildirir. Her uyarı süper admin paneline
 * (/super) kaydedilir; aynı konuda okunmamış uyarı varsa yeni satır açılmaz,
 * sayacı artar. Ek olarak, ayarlıysa dışarıya da gönderilir:
 *
 *  - UYARI_WEBHOOK_URL: Slack / Discord / benzeri gelen-webhook adresi
 *  - TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID: Telegram botu
 *
 * Dış bildirimler aynı konu için `aralikDk` içinde en fazla bir kez gider.
 * Bu fonksiyon hiçbir zaman hata fırlatmaz. Telefon numarası, token gibi
 * gizli bilgileri `detay` içine koyma.
 */
export async function uyar(
  baslik: string,
  detay = "",
  konu = baslik,
  aralikDk = 15,
  isletmeId?: string
): Promise<void> {
  console.error(`[UYARI] ${baslik}${detay ? ` | ${detay.slice(0, 300)}` : ""}`);

  await panelKaydet(baslik, detay.slice(0, 500), konu, isletmeId);
  await disaGonder(baslik, detay, konu, aralikDk);
}

async function panelKaydet(baslik: string, detay: string, konu: string, isletmeId?: string) {
  try {
    const db = await createServerClient();
    const simdi = new Date().toISOString();

    const guncelle = async () => {
      const { data: acik } = await db
        .from("uyarilar")
        .select("id, adet")
        .eq("konu", konu)
        .eq("okundu", false)
        .maybeSingle();
      if (!acik) return false;
      await db
        .from("uyarilar")
        .update({ adet: acik.adet + 1, detay: detay || null, son_olusma_at: simdi })
        .eq("id", acik.id);
      return true;
    };

    if (await guncelle()) return;
    const { error } = await db.from("uyarilar").insert({
      konu,
      baslik,
      detay: detay || null,
      isletme_id: isletmeId ?? null,
    });
    // Aynı anda başka bir istek aynı konuyu açtıysa (unique ihlali) sayaca ekle.
    if (error?.code === "23505") await guncelle();
    else if (error) console.error("[Uyari panel]", error.message);
  } catch (err) {
    console.error("[Uyari panel]", err instanceof Error ? err.message : err);
  }
}

async function disaGonder(baslik: string, detay: string, konu: string, aralikDk: number) {
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

import { anthropicBotYaniti } from "@/lib/anthropic/bot";
import { groqBotYaniti } from "@/lib/groq/bot";
import { createServerClient } from "@/lib/supabase/server";
import { aydinlatmaNotu } from "@/lib/kvkk";

export type BotSaglayici = "groq" | "anthropic";

export function botSaglayici(): BotSaglayici {
  return process.env.BOT_SAGLAYICI === "anthropic" ? "anthropic" : "groq";
}

/** Müşteri botla ilk kez mi konuşuyor: aktif bir sohbeti ve hiç randevusu yok. */
async function ilkTemasMi(isletmeId: string, musteriNo: string): Promise<boolean> {
  try {
    const db = await createServerClient();
    const [{ data: sohbet }, { count: randevuSayisi }] = await Promise.all([
      db.from("konusmalar").select("guncellendi_at").eq("isletme_id", isletmeId).eq("musteri_no", musteriNo).maybeSingle(),
      db.from("randevular").select("id", { count: "exact", head: true }).eq("isletme_id", isletmeId).eq("musteri_whatsapp", musteriNo),
    ]);
    const sohbetAktif = !!sohbet && Date.now() - new Date(sohbet.guncellendi_at).getTime() < 12 * 3600_000;
    return !sohbetAktif && (randevuSayisi ?? 0) === 0;
  } catch {
    return false;
  }
}

/**
 * Web test sohbeti ve WhatsApp aynı botu kullanır; böylece web'de test edilen
 * davranış müşterinin WhatsApp'ta göreceğiyle birebir aynıdır.
 * Müşteri ilk kez yazıyorsa cevabın sonuna kişisel veri (KVKK) bilgilendirmesi eklenir.
 */
export async function botYaniti(musteriNo: string, mesaj: string, isletmeId: string): Promise<string> {
  const yeniMusteri = await ilkTemasMi(isletmeId, musteriNo);
  const yanit =
    botSaglayici() === "anthropic"
      ? await anthropicBotYaniti(musteriNo, mesaj, isletmeId)
      : await groqBotYaniti(musteriNo, mesaj, isletmeId);
  return yeniMusteri ? `${yanit}\n\n${aydinlatmaNotu(isletmeId)}` : yanit;
}

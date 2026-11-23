import { anthropicBotYaniti } from "@/lib/anthropic/bot";
import { groqBotYaniti } from "@/lib/groq/bot";

export type BotSaglayici = "groq" | "anthropic";

export function botSaglayici(): BotSaglayici {
  return process.env.BOT_SAGLAYICI === "anthropic" ? "anthropic" : "groq";
}

/**
 * Web test sohbeti ve WhatsApp aynı botu kullanır; böylece web'de test edilen
 * davranış müşterinin WhatsApp'ta göreceğiyle birebir aynıdır.
 */
export function botYaniti(musteriNo: string, mesaj: string, isletmeId: string): Promise<string> {
  return botSaglayici() === "anthropic"
    ? anthropicBotYaniti(musteriNo, mesaj, isletmeId)
    : groqBotYaniti(musteriNo, mesaj, isletmeId);
}

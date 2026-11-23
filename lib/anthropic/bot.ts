import Anthropic from "@anthropic-ai/sdk";
import { KUAFOR_TOOLS } from "./tools";
import { toolCalistir } from "./tool-executor";
import { anthropicClient } from "./client";
import { isletmeAdi, konusmaGetir, konusmaKaydet } from "@/lib/konusma";
import { sistemPrompt } from "@/lib/bot/prompt";

const MAKS_TUR = 8;
const SAGLAYICI = "anthropic";

const kullaniciMesajiMi = (m: Anthropic.MessageParam) =>
  m.role === "user" && typeof m.content === "string";

export async function anthropicBotYaniti(
  musteriNo: string,
  gelenMesaj: string,
  isletmeId: string
): Promise<string> {
  const [mesajlar, isletme] = await Promise.all([
    konusmaGetir<Anthropic.MessageParam>(isletmeId, musteriNo, SAGLAYICI),
    isletmeAdi(isletmeId),
  ]);
  mesajlar.push({ role: "user", content: gelenMesaj });

  for (let tur = 0; tur < MAKS_TUR; tur++) {
    const yanit = await anthropicClient.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-opus-4-7",
      max_tokens: 1024,
      system: [
        {
          type: "text",
          text: sistemPrompt(isletme),
          cache_control: { type: "ephemeral" } as never,
        },
      ],
      tools: KUAFOR_TOOLS,
      messages: mesajlar,
    });

    mesajlar.push({ role: "assistant", content: yanit.content });

    if (yanit.stop_reason !== "tool_use") break;

    const toolSonuclari: Anthropic.ToolResultBlockParam[] = [];
    for (const blok of yanit.content) {
      if (blok.type !== "tool_use") continue;
      const sonuc = await toolCalistir(
        blok.name,
        blok.input as Record<string, unknown>,
        isletmeId,
        musteriNo
      );
      toolSonuclari.push({ type: "tool_result", tool_use_id: blok.id, content: sonuc });
    }
    mesajlar.push({ role: "user", content: toolSonuclari });
  }

  await konusmaKaydet(isletmeId, musteriNo, SAGLAYICI, mesajlar, kullaniciMesajiMi);

  const sonBlok = mesajlar.at(-1);
  if (sonBlok?.role === "assistant" && Array.isArray(sonBlok.content)) {
    const metinBlok = sonBlok.content.find((b) => b.type === "text");
    if (metinBlok && "text" in metinBlok) return metinBlok.text;
  }

  return "Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.";
}

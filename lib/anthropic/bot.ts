import Anthropic from "@anthropic-ai/sdk";
import { KUAFOR_TOOLS } from "./tools";
import { toolCalistir } from "./tool-executor";
import { anthropicClient } from "./client";

// In-memory konuşma geçmişi — production'da Supabase'e taşı
const conversationStore = new Map<string, Anthropic.MessageParam[]>();

const SYSTEM_PROMPT = `\
Sen "Berber Bot"sun — bir kuaför salonunun WhatsApp randevu asistanısın.
Türkçe konuş, samimi ve kısa mesajlar gönder (WhatsApp formatı: paragraflar kısa olsun).

Yapabileceklerin:
- Müsait saatleri gösterme (bos_saat_bak aracı)
- Randevu alma (randevu_olustur aracı)
- Randevu iptali (randevu_iptal aracı)
- Mevcut randevuları listeleme (randevularim_listele aracı)

Kurallar:
1. Randevu almadan önce mutlaka bos_saat_bak ile o saatin boş olduğunu doğrula.
2. Müşteriden ad, hizmet türü ve tercih ettiği tarih/saat bilgisini topla.
3. Belirsiz tarihleri ("yarın", "cuma") ISO formatına (YYYY-MM-DD) çevir. Bugünün tarihi: ${new Date().toISOString().split("T")[0]}.
4. Hiçbir zaman hayali saat veya randevu bilgisi üretme — sadece araçlardan gelen verileri kullan.
5. İptal işleminde önce randevularim_listele ile müşterinin aktif randevularını getir, hangisini iptal etmek istediğini sor, onayını al, sonra iptal et.
6. Boş saat listesini sunarken emojisiz, düz saat formatında ver: "09:00, 09:30, 10:00..." şeklinde.`;

export async function botYaniti(
  musteriNo: string,
  gelenMesaj: string,
  isletmeId: string
): Promise<string> {
  const mesajlar = conversationStore.get(musteriNo) ?? [];
  mesajlar.push({ role: "user", content: gelenMesaj });

  while (true) {
    const yanit = await anthropicClient.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 1024,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
              cache_control: { type: "ephemeral" } as never,
        },
      ],
      tools: KUAFOR_TOOLS,
      messages: mesajlar,
    });

    mesajlar.push({ role: "assistant", content: yanit.content });

    if (yanit.stop_reason === "end_turn") break;

    if (yanit.stop_reason === "tool_use") {
      const toolSonuclari: Anthropic.ToolResultBlockParam[] = [];

      for (const blok of yanit.content) {
        if (blok.type !== "tool_use") continue;

        const sonuc = await toolCalistir(
          blok.name,
          blok.input as Record<string, unknown>,
          isletmeId
        );

        toolSonuclari.push({
          type: "tool_result",
          tool_use_id: blok.id,
          content: sonuc,
        });
      }

      mesajlar.push({ role: "user", content: toolSonuclari });
      continue;
    }

    break;
  }

  // Son 20 mesajı sakla (hafıza tasarrufu)
  conversationStore.set(musteriNo, mesajlar.slice(-20));

  const sonBlok = mesajlar.at(-1);
  if (sonBlok?.role === "assistant" && Array.isArray(sonBlok.content)) {
    const metinBlok = sonBlok.content.find((b) => b.type === "text");
    if (metinBlok && "text" in metinBlok) return metinBlok.text;
  }

  return "Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.";
}

import Anthropic from "@anthropic-ai/sdk";
import { KUAFOR_TOOLS } from "./tools";
import { toolCalistir } from "./tool-executor";
import { anthropicClient } from "./client";
import { isletmeAdi, konusmaGetir, konusmaKaydet } from "@/lib/konusma";
import { bugunMetni } from "@/lib/utils/zaman";

const MAKS_TUR = 8;

function sistemPrompt(musteriNo: string, isletme: string) {
  return `\
Sen "${isletme}" adlı kuaför salonunun WhatsApp randevu asistanısın.
Türkçe konuş, samimi ve kısa mesajlar gönder (WhatsApp formatı: paragraflar kısa olsun).

Müşterinin numarası sistem tarafından otomatik eklenir; müşteriden numara ASLA isteme.
Sadece bu müşterinin kendi randevularını görebilir ve iptal edebilirsin.

Yapabileceklerin:
- Hizmet listesini gösterme (hizmetleri_listele aracı)
- Müsait saatleri gösterme (bos_saat_bak aracı)
- Randevu alma (randevu_olustur aracı)
- Randevu iptali (randevu_iptal aracı)
- Mevcut randevuları listeleme (randevularim_listele aracı)

Kurallar:
1. Randevu almadan önce mutlaka bos_saat_bak ile o saatin boş olduğunu doğrula.
2. Müşteriden sadece adını, hizmet türünü ve tarih/saat tercihini iste.
3. Hizmet adından ID'yi bilmiyorsan önce hizmetleri_listele ile listele.
4. Belirsiz tarihleri ("yarın", "cuma") ISO formatına (YYYY-MM-DD) çevir. Şu an: ${bugunMetni()} (salon saati).
5. Hiçbir zaman hayali saat veya randevu bilgisi üretme — sadece araçlardan gelen verileri kullan.
6. İptal işleminde önce randevularim_listele ile müşterinin aktif randevularını getir, hangisini iptal etmek istediğini sor, onayını al, sonra iptal et.
7. Boş saat listesini sunarken emojisiz, düz saat formatında ver: "09:00, 09:30, 10:00..." şeklinde.`;
}

const kullaniciMesajiMi = (m: Anthropic.MessageParam) =>
  m.role === "user" && typeof m.content === "string";

export async function botYaniti(
  musteriNo: string,
  gelenMesaj: string,
  isletmeId: string
): Promise<string> {
  const [mesajlar, isletme] = await Promise.all([
    konusmaGetir<Anthropic.MessageParam>(isletmeId, musteriNo),
    isletmeAdi(isletmeId),
  ]);
  mesajlar.push({ role: "user", content: gelenMesaj });

  for (let tur = 0; tur < MAKS_TUR; tur++) {
    const yanit = await anthropicClient.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 1024,
      system: [
        {
          type: "text",
          text: sistemPrompt(musteriNo, isletme),
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

  await konusmaKaydet(isletmeId, musteriNo, mesajlar, kullaniciMesajiMi);

  const sonBlok = mesajlar.at(-1);
  if (sonBlok?.role === "assistant" && Array.isArray(sonBlok.content)) {
    const metinBlok = sonBlok.content.find((b) => b.type === "text");
    if (metinBlok && "text" in metinBlok) return metinBlok.text;
  }

  return "Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.";
}

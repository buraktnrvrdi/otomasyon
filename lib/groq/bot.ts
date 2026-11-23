import Groq from "groq-sdk";
import { toolCalistir } from "@/lib/anthropic/tool-executor";
import { createServerClient } from "@/lib/supabase/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function konusmaGetir(isletmeId: string, musteriNo: string): Promise<Groq.Chat.ChatCompletionMessageParam[]> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("konusmalar")
    .select("mesajlar")
    .eq("isletme_id", isletmeId)
    .eq("musteri_no", musteriNo)
    .single();
  return (data?.mesajlar as Groq.Chat.ChatCompletionMessageParam[]) ?? [];
}

async function konusmaKaydet(isletmeId: string, musteriNo: string, mesajlar: Groq.Chat.ChatCompletionMessageParam[]) {
  const supabase = await createServerClient();
  await supabase
    .from("konusmalar")
    .upsert(
      {
        isletme_id: isletmeId,
        musteri_no: musteriNo,
        mesajlar: mesajlar.slice(-20),
        guncellendi_at: new Date().toISOString(),
      },
      { onConflict: "isletme_id,musteri_no" }
    );
}

async function isletmeAdi(isletmeId: string): Promise<string> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("isletme")
    .select("ad")
    .eq("id", isletmeId)
    .single();
  return data?.ad ?? "Kuaför";
}

function sistemPrompt(musteriNo: string, isletme: string) {
  return `\
Sen "${isletme}" adlı kuaför salonunun WhatsApp randevu asistanısın.
Türkçe konuş, samimi ve kısa mesajlar gönder.

Müşterinin telefon numarası: ${musteriNo}
Bu numarayı randevu oluştururken ve listelerken kullan. Müşteriden numara ASLA isteme.

Yapabileceklerin:
- Hizmet listesini gösterme (hizmetleri_listele aracı)
- Müsait saatleri gösterme (bos_saat_bak aracı)
- Randevu alma (randevu_olustur aracı)
- Randevu iptali (randevu_iptal aracı)
- Mevcut randevuları listeleme (randevularim_listele aracı)

Kurallar:
1. Randevu almadan önce mutlaka bos_saat_bak ile o saatin boş olduğunu doğrula.
2. Müşteriden sadece adını, hizmet türünü ve tarih/saat tercihini iste. Numara sorma.
3. Hizmet adından ID'yi bilmiyorsan önce hizmetleri_listele ile listele.
4. Belirsiz tarihleri ("yarın", "cuma") ISO formatına (YYYY-MM-DD) çevir. Bugünün tarihi: ${new Date().toISOString().split("T")[0]}.
5. Hiçbir zaman hayali saat veya randevu bilgisi üretme.
6. İptal işleminde önce randevularim_listele ile müşterinin aktif randevularını getir, onayını al, sonra iptal et.
7. Boş saat listesini sunarken düz saat formatında ver: "09:00, 09:30, 10:00..." şeklinde.
8. Seçilen saat doluysa özür dile ve aynı gün için bos_saat_bak ile alternatif saatler sun.`;
}

const TOOLS: Groq.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "bos_saat_bak",
      description: "Belirtilen tarih ve hizmet için müsait randevu saatlerini listeler.",
      parameters: {
        type: "object",
        properties: {
          tarih: { type: "string", description: "YYYY-MM-DD formatında tarih" },
          hizmet_id: { type: "string", description: "Hizmetin UUID'si (opsiyonel)" },
        },
        required: ["tarih"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "randevu_olustur",
      description: "Yeni bir randevu oluşturur. Önce bos_saat_bak ile doğrula.",
      parameters: {
        type: "object",
        properties: {
          musteri_ad: { type: "string", description: "Müşterinin adı soyadı" },
          musteri_whatsapp: { type: "string", description: "WhatsApp numarası (+90 ile)" },
          hizmet_id: { type: "string", description: "Hizmet UUID'si" },
          baslangic: { type: "string", description: "ISO 8601 başlangıç zamanı" },
          notlar: { type: "string", description: "Opsiyonel not" },
        },
        required: ["musteri_ad", "musteri_whatsapp", "hizmet_id", "baslangic"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "randevu_iptal",
      description: "Mevcut bir randevuyu iptal eder.",
      parameters: {
        type: "object",
        properties: {
          randevu_id: { type: "string", description: "İptal edilecek randevu UUID'si" },
          iptal_nedeni: { type: "string", description: "İptal sebebi (opsiyonel)" },
        },
        required: ["randevu_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "hizmetleri_listele",
      description: "Salondaki tüm aktif hizmetleri, sürelerini ve fiyatlarını listeler.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "randevularim_listele",
      description: "Müşterinin aktif randevularını listeler.",
      parameters: {
        type: "object",
        properties: {
          musteri_whatsapp: { type: "string", description: "Müşterinin WhatsApp numarası" },
        },
        required: ["musteri_whatsapp"],
      },
    },
  },
];

export async function groqBotYaniti(musteriNo: string, gelenMesaj: string, isletmeId: string): Promise<string> {
  const [mesajlar, isletme] = await Promise.all([
    konusmaGetir(isletmeId, musteriNo),
    isletmeAdi(isletmeId),
  ]);

  mesajlar.push({ role: "user", content: gelenMesaj });

  while (true) {
    const yanit = await groq.chat.completions.create({
      model: "qwen/qwen3.8-27b",
      max_tokens: 1024,
      messages: [{ role: "system", content: sistemPrompt(musteriNo, isletme) }, ...mesajlar],
      tools: TOOLS,
      tool_choice: "auto",
    });

    const mesaj = yanit.choices[0].message;
    mesajlar.push(mesaj);

    if (yanit.choices[0].finish_reason === "stop" || !mesaj.tool_calls?.length) break;

    for (const toolCall of mesaj.tool_calls) {
      const sonuc = await toolCalistir(
        toolCall.function.name,
        JSON.parse(toolCall.function.arguments),
        isletmeId
      );
      mesajlar.push({ role: "tool", tool_call_id: toolCall.id, content: sonuc });
    }
  }

  await konusmaKaydet(isletmeId, musteriNo, mesajlar);

  const sonMesaj = mesajlar.at(-1);
  if (sonMesaj?.role === "assistant" && typeof sonMesaj.content === "string") {
    return sonMesaj.content;
  }

  return "Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.";
}

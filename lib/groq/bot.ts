import Groq from "groq-sdk";
import { toolCalistir } from "@/lib/anthropic/tool-executor";
import { isletmeAdi, konusmaGetir, konusmaKaydet } from "@/lib/konusma";
import { sistemPrompt } from "@/lib/bot/prompt";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MAKS_TUR = 8;
const SAGLAYICI = "groq";

type Mesaj = Groq.Chat.ChatCompletionMessageParam;
const kullaniciMesajiMi = (m: Mesaj) => m.role === "user";

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
          randevu_id: {
            type: "string",
            description: "Mevcut randevuyu TAŞIRKEN o randevunun UUID'si (kendi saati meşgul sayılmaz)",
          },
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
          hizmet_id: { type: "string", description: "Hizmet UUID'si" },
          tarih: { type: "string", description: "Randevu tarihi (YYYY-MM-DD)" },
          saat: { type: "string", description: "bos_saat_bak'tan dönen saatlerden biri (HH:mm)" },
          notlar: { type: "string", description: "Opsiyonel not" },
        },
        required: ["musteri_ad", "hizmet_id", "tarih", "saat"],
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
      name: "randevu_tasi",
      description:
        "Müşterinin mevcut randevusunu başka tarih/saate taşır. Önce bos_saat_bak'ı randevu_id vererek çağır ve müşteriye yeni saati onaylat.",
      parameters: {
        type: "object",
        properties: {
          randevu_id: { type: "string", description: "Taşınacak randevu UUID'si" },
          tarih: { type: "string", description: "Yeni tarih (YYYY-MM-DD)" },
          saat: { type: "string", description: "Yeni saat, bos_saat_bak'tan dönen saatlerden biri (HH:mm)" },
        },
        required: ["randevu_id", "tarih", "saat"],
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
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
];

export async function groqBotYaniti(musteriNo: string, gelenMesaj: string, isletmeId: string): Promise<string> {
  const [mesajlar, isletme] = await Promise.all([
    konusmaGetir<Mesaj>(isletmeId, musteriNo, SAGLAYICI),
    isletmeAdi(isletmeId),
  ]);

  mesajlar.push({ role: "user", content: gelenMesaj });

  for (let tur = 0; tur < MAKS_TUR; tur++) {
    const yanit = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || "qwen/qwen3.8-27b",
      max_tokens: 1024,
      messages: [{ role: "system", content: sistemPrompt(isletme) }, ...mesajlar],
      tools: TOOLS,
      tool_choice: "auto",
    });

    const mesaj = yanit.choices[0].message;
    mesajlar.push(mesaj);

    if (yanit.choices[0].finish_reason === "stop" || !mesaj.tool_calls?.length) break;

    for (const toolCall of mesaj.tool_calls) {
      let girdi: Record<string, unknown>;
      try {
        girdi = JSON.parse(toolCall.function.arguments || "{}");
      } catch {
        girdi = {};
      }
      const sonuc = await toolCalistir(toolCall.function.name, girdi, isletmeId, musteriNo);
      mesajlar.push({ role: "tool", tool_call_id: toolCall.id, content: sonuc });
    }
  }

  await konusmaKaydet(isletmeId, musteriNo, SAGLAYICI, mesajlar, kullaniciMesajiMi);

  const sonMesaj = mesajlar.at(-1);
  if (sonMesaj?.role === "assistant" && typeof sonMesaj.content === "string") {
    // Bazı modeller düşünme metnini <think> bloğunda döndürür; müşteriye gitmemeli.
    const metin = sonMesaj.content.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    if (metin) return metin;
  }

  return "Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.";
}

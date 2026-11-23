import Anthropic from "@anthropic-ai/sdk";

export const KUAFOR_TOOLS: Anthropic.Tool[] = [
  {
    name: "bos_saat_bak",
    description: `
      Belirtilen tarih ve hizmet için müsait randevu saatlerini listeler.
      Mevcut randevuları, çalışma saatlerini ve hizmet süresini dikkate alır.
      Müşteri bir tarih veya "yarın", "bu hafta sonu" gibi ifade kullandığında çağır.
    `,
    input_schema: {
      type: "object" as const,
      properties: {
        tarih: {
          type: "string",
          description: "Kontrol edilecek tarih (ISO 8601: YYYY-MM-DD)",
        },
        hizmet_id: {
          type: "string",
          description: "Hizmetin UUID'si (opsiyonel)",
        },
      },
      required: ["tarih"],
    },
  },
  {
    name: "hizmetleri_listele",
    description:
      "Salondaki tüm aktif hizmetleri, ID'lerini, sürelerini ve fiyatlarını listeler.",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "randevu_olustur",
    description: `
      Yeni bir randevu kaydı oluşturur. Çağırmadan önce:
      1) bos_saat_bak ile o saatin hâlâ boş olduğunu doğrula.
      2) Müşteriden ad, hizmet ve saat bilgilerini aldıktan sonra çağır.
    `,
    input_schema: {
      type: "object" as const,
      properties: {
        musteri_ad: {
          type: "string",
          description: "Müşterinin adı soyadı",
        },
        musteri_whatsapp: {
          type: "string",
          description: "Müşterinin WhatsApp numarası (+90 ile başlamalı)",
        },
        hizmet_id: {
          type: "string",
          description: "Seçilen hizmetin UUID'si",
        },
        baslangic: {
          type: "string",
          description: "Randevu başlangıç zamanı (ISO 8601: YYYY-MM-DDTHH:mm:ssZ)",
        },
        notlar: {
          type: "string",
          description: "Opsiyonel müşteri notu",
        },
      },
      required: ["musteri_ad", "musteri_whatsapp", "hizmet_id", "baslangic"],
    },
  },
  {
    name: "randevu_iptal",
    description: `
      Mevcut bir randevuyu iptal eder.
      Önce müşterinin aktif randevularını getir, hangisini iptal etmek
      istediğini onaylat, sonra bu aracı çağır.
    `,
    input_schema: {
      type: "object" as const,
      properties: {
        randevu_id: {
          type: "string",
          description: "İptal edilecek randevunun UUID'si",
        },
        iptal_nedeni: {
          type: "string",
          description: "İptal sebebi (opsiyonel)",
        },
      },
      required: ["randevu_id"],
    },
  },
  {
    name: "randevularim_listele",
    description: `
      Müşterinin aktif (beklemede/onaylandi) randevularını listeler.
      İptal işleminden önce veya müşteri randevularını sorduğunda çağır.
    `,
    input_schema: {
      type: "object" as const,
      properties: {
        musteri_whatsapp: {
          type: "string",
          description: "Müşterinin WhatsApp numarası",
        },
      },
      required: ["musteri_whatsapp"],
    },
  },
];

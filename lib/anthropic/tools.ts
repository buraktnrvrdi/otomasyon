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
        randevu_id: {
          type: "string",
          description:
            "Mevcut bir randevuyu TAŞIRKEN o randevunun UUID'si. Verilirse randevunun kendi süresi kullanılır ve kendi saati meşgul sayılmaz.",
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
        hizmet_id: {
          type: "string",
          description: "Seçilen hizmetin UUID'si",
        },
        tarih: {
          type: "string",
          description: "Randevu tarihi (YYYY-MM-DD)",
        },
        saat: {
          type: "string",
          description: "Randevu saati, bos_saat_bak'tan dönen saatlerden biri (HH:mm, salon saati)",
        },
        notlar: {
          type: "string",
          description: "Opsiyonel müşteri notu",
        },
      },
      required: ["musteri_ad", "hizmet_id", "tarih", "saat"],
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
    name: "randevu_tasi",
    description: `
      Müşterinin mevcut randevusunu başka bir tarih/saate taşır (hizmet aynı kalır).
      Önce randevularim_listele ile randevuyu belirle, bos_saat_bak'ı randevu_id vererek
      çağırıp boş saati bul, müşteriye yeni tarih/saati onaylat, sonra bu aracı çağır.
    `,
    input_schema: {
      type: "object" as const,
      properties: {
        randevu_id: {
          type: "string",
          description: "Taşınacak randevunun UUID'si",
        },
        tarih: {
          type: "string",
          description: "Yeni tarih (YYYY-MM-DD)",
        },
        saat: {
          type: "string",
          description: "Yeni saat, bos_saat_bak'tan dönen saatlerden biri (HH:mm, salon saati)",
        },
      },
      required: ["randevu_id", "tarih", "saat"],
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
      properties: {},
    },
  },
];

import type { WhatsAppMessage, WhatsAppDurum } from "./types";
import { bsuidMi } from "./kimlik";

/** "+905551234567" biçimine getirir; yurt içi yazımlar (0555..., 555...) Türkiye kabul edilir. */
export function numaraNormalize(no: string): string {
  let rakamlar = String(no).replace(/\D/g, "");
  if (rakamlar.length === 11 && rakamlar.startsWith("0")) rakamlar = "90" + rakamlar.slice(1);
  else if (rakamlar.length === 10 && rakamlar.startsWith("5")) rakamlar = "90" + rakamlar;
  return rakamlar ? "+" + rakamlar : "";
}

export function parseTwilioPayload(form: URLSearchParams): WhatsAppMessage | null {
  const from = form.get("From")?.toString();
  const to = form.get("To")?.toString();
  const body = form.get("Body")?.toString();

  if (!from || !to || !body) return null;

  // Twilio prefix: "whatsapp:+90..." → "+90..."
  return {
    from: numaraNormalize(from),
    to: numaraNormalize(to),
    text: body.trim(),
    mesajId: form.get("MessageSid")?.toString() || undefined,
  };
}

/** Meta bir istekte birden fazla entry/change gönderebilir; hepsinin value alanlarını düzleştirir. */
function metaDegerleri(body: unknown): any[] {
  const entries = Array.isArray((body as any)?.entry) ? (body as any).entry : [];
  return entries.flatMap((e: any) =>
    Array.isArray(e?.changes) ? e.changes.map((c: any) => c?.value).filter(Boolean) : []
  );
}

/** Butona/listeye tıklama gibi mesajlardan da kullanıcının seçtiği metni çıkarır. */
function mesajMetni(message: any): string | null {
  switch (message?.type) {
    case "text":
      return message.text?.body ?? null;
    case "button":
      return message.button?.text ?? null;
    case "interactive":
      return (
        message.interactive?.button_reply?.title ??
        message.interactive?.list_reply?.title ??
        null
      );
    default:
      return null;
  }
}

export function parseMetaPayload(body: unknown): WhatsAppMessage | null {
  try {
    for (const value of metaDegerleri(body)) {
      const message = value?.messages?.[0];
      if (!message) continue;

      // Telefon varsa onu kullan; kullanıcı adı açık kişilerde Meta yalnızca BSUID gönderir.
      const telefon = numaraNormalize(message.from ?? value?.contacts?.[0]?.wa_id ?? "");
      const bsuid = String(message.from_user_id ?? value?.contacts?.[0]?.user_id ?? "");
      const from = telefon || (bsuidMi(bsuid) ? bsuid : "");
      if (!from) return null;

      const metin = mesajMetni(message)?.trim() ?? "";
      return {
        from,
        to: numaraNormalize(value.metadata?.display_phone_number ?? ""),
        phoneNumberId: value.metadata?.phone_number_id,
        text: metin,
        mesajId: typeof message.id === "string" ? message.id : undefined,
        // Sesli mesaj, fotoğraf, konum vb. botun anlayamadığı içerikler.
        desteklenmeyen: !metin && message.type !== "reaction" ? message.type ?? "bilinmiyor" : undefined,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/** Meta'nın gönderdiğimiz mesajlar için yolladığı teslim bildirimleri (sent/delivered/read/failed). */
export function parseMetaDurumlari(body: unknown): WhatsAppDurum[] {
  try {
    return metaDegerleri(body).flatMap((value) =>
      Array.isArray(value?.statuses)
        ? value.statuses.map((s: any) => ({
            durum: String(s?.status ?? "bilinmiyor"),
            mesajId: String(s?.id ?? ""),
            alici: String(s?.recipient_id ?? s?.recipient_user_id ?? ""),
            hatalar: Array.isArray(s?.errors)
              ? s.errors.map((h: any) => ({
                  kod: h?.code,
                  baslik: String(h?.title ?? h?.message ?? ""),
                  detay: h?.error_data?.details ? String(h.error_data.details) : undefined,
                }))
              : [],
          }))
        : []
    );
  } catch {
    return [];
  }
}

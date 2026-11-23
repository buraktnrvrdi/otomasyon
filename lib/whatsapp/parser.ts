import type { WhatsAppMessage } from "./types";
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
  };
}

export function parseMetaPayload(body: unknown): WhatsAppMessage | null {
  try {
    const value = (body as any)?.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];

    if (!message || message.type !== "text") return null;

    // Telefon varsa onu kullan; kullanıcı adı açık kişilerde Meta yalnızca BSUID gönderir.
    const telefon = numaraNormalize(message.from ?? value?.contacts?.[0]?.wa_id ?? "");
    const bsuid = String(message.from_user_id ?? value?.contacts?.[0]?.user_id ?? "");
    const from = telefon || (bsuidMi(bsuid) ? bsuid : "");
    if (!from) return null;

    return {
      from,
      to: numaraNormalize(value.metadata?.display_phone_number ?? ""),
      phoneNumberId: value.metadata?.phone_number_id,
      text: message.text.body.trim(),
    };
  } catch {
    return null;
  }
}

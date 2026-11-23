import type { WhatsAppMessage } from "./types";

export function numaraNormalize(no: string): string {
  const rakamlar = no.replace(/\D/g, "");
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

    return {
      from: numaraNormalize(message.from),
      to: numaraNormalize(value.metadata?.display_phone_number ?? ""),
      phoneNumberId: value.metadata?.phone_number_id,
      text: message.text.body.trim(),
    };
  } catch {
    return null;
  }
}

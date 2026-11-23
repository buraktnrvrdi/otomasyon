import type { WhatsAppMessage } from "./types";

export function parseTwilioPayload(form: FormData): WhatsAppMessage | null {
  const from = form.get("From")?.toString();
  const body = form.get("Body")?.toString();

  if (!from || !body) return null;

  // Twilio prefix: "whatsapp:+90..." → "+90..."
  return {
    from: from.replace("whatsapp:", ""),
    text: body.trim(),
  };
}

export function parseMetaPayload(body: unknown): WhatsAppMessage | null {
  try {
    const entry = (body as any)?.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];

    if (!message || message.type !== "text") return null;

    return {
      from: "+" + message.from,
      text: message.text.body.trim(),
    };
  } catch {
    return null;
  }
}

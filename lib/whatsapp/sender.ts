interface Gonderen {
  /** Twilio: işletmenin numarası */
  numara?: string;
  /** Meta: işletmenin phone_number_id değeri */
  phoneNumberId?: string;
}

export async function mesajGonder(
  to: string,
  metin: string,
  gonderen: Gonderen = {}
): Promise<void> {
  const provider = process.env.WHATSAPP_PROVIDER ?? "twilio";

  if (provider === "meta") {
    await metaGonder(to, metin, gonderen.phoneNumberId);
  } else {
    await twilioGonder(to, metin, gonderen.numara);
  }
}

async function twilioGonder(to: string, metin: string, numara?: string): Promise<void> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;

  const body = new URLSearchParams({
    From: `whatsapp:${numara ?? process.env.TWILIO_WHATSAPP_FROM}`,
    To: `whatsapp:${to}`,
    Body: metin,
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(
          `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
        ).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Twilio gönderim hatası: ${err}`);
  }
}

async function metaGonder(to: string, metin: string, phoneNumberId?: string): Promise<void> {
  const phoneId = phoneNumberId ?? process.env.META_PHONE_NUMBER_ID;
  const url = `https://graph.facebook.com/v19.0/${phoneId}/messages`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: to.replace("+", ""),
      type: "text",
      text: { body: metin },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Meta API gönderim hatası: ${err}`);
  }
}

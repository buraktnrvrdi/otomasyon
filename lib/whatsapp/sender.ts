import { bsuidMi } from "./kimlik";

interface Gonderen {
  /** Twilio: işletmenin numarası */
  numara?: string;
  /** Meta: işletmenin phone_number_id değeri */
  phoneNumberId?: string;
}

const saglayici = () => process.env.WHATSAPP_PROVIDER || "meta";

/** Telefon için `to`, BSUID için `recipient` alanı (Meta, numarası gizli kullanıcılara böyle gönderilir). */
function metaHedef(kimlik: string): Record<string, string> {
  if (bsuidMi(kimlik)) return { recipient_type: "individual", recipient: kimlik };
  return { to: kimlik.replace("+", "") };
}

/** Serbest metin: sadece müşterinin son 24 saatte yazdığı sohbetlerde gönderilebilir. */
export async function mesajGonder(
  to: string,
  metin: string,
  gonderen: Gonderen = {}
): Promise<void> {
  if (saglayici() === "meta") {
    await metaPost(gonderen.phoneNumberId, {
      ...metaHedef(to),
      type: "text",
      text: { body: metin },
    });
  } else {
    await twilioPost(gonderen.numara, to, { Body: metin });
  }
}

/**
 * Onaylı şablon mesajı: 24 saat kuralına takılmadan müşteriye ilk mesajı
 * (ör. hatırlatma) göndermenin tek yolu. sablon: Meta'da şablon adı,
 * Twilio'da Content SID (HX...). degiskenler şablondaki {{1}}, {{2}}... sırasıyla.
 */
export async function sablonGonder(
  to: string,
  sablon: string,
  degiskenler: string[],
  gonderen: Gonderen = {}
): Promise<void> {
  if (saglayici() === "meta") {
    await metaPost(gonderen.phoneNumberId, {
      ...metaHedef(to),
      type: "template",
      template: {
        name: sablon,
        language: { code: process.env.WHATSAPP_SABLON_DIL || "tr" },
        components: [
          {
            type: "body",
            parameters: degiskenler.map((text) => ({ type: "text", text })),
          },
        ],
      },
    });
  } else {
    await twilioPost(gonderen.numara, to, {
      ContentSid: sablon,
      ContentVariables: JSON.stringify(
        Object.fromEntries(degiskenler.map((d, i) => [String(i + 1), d]))
      ),
    });
  }
}

async function twilioPost(numara: string | undefined, to: string, alanlar: Record<string, string>) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization:
        "Basic " + Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      From: `whatsapp:${numara ?? process.env.TWILIO_WHATSAPP_FROM}`,
      To: `whatsapp:${to}`,
      ...alanlar,
    }),
  });

  if (!res.ok) throw new Error(`Twilio gönderim hatası: ${await res.text()}`);
}

/** Eski Graph sürümleri Meta tarafından kapatılır; gerekirse ortam değişkeniyle güncellenir. */
const GRAPH_SURUMU = () => process.env.META_GRAPH_VERSION || "v24.0";

async function metaPost(phoneNumberId: string | undefined, govde: Record<string, unknown>) {
  const phoneId = phoneNumberId ?? process.env.META_PHONE_NUMBER_ID;
  if (!phoneId || !process.env.META_ACCESS_TOKEN) {
    throw new Error("Meta ayarlari eksik: META_ACCESS_TOKEN ve META_PHONE_NUMBER_ID gerekli.");
  }
  const res = await fetch(`https://graph.facebook.com/${GRAPH_SURUMU()}/${phoneId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messaging_product: "whatsapp", ...govde }),
  });

  if (!res.ok) throw new Error(`Meta API gönderim hatası: ${await res.text()}`);

  // Teslim bildirimiyle eşleştirebilmek için Meta'nın verdiği mesaj kimliğini logla.
  const json = await res.json().catch(() => null);
  console.log(`[WA gonderildi] id=${json?.messages?.[0]?.id ?? "?"} tur=${govde.type}`);
}

import { createHmac, timingSafeEqual } from "node:crypto";

function esit(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/**
 * Twilio: base64(HMAC-SHA1(auth token, tam URL + sıralı parametre adı+değer)).
 * URL, Twilio'nun çağırdığı adresle birebir aynı olmalı; proxy arkasında
 * farklı görünüyorsa WHATSAPP_WEBHOOK_URL ile verilir.
 */
export function twilioImzaGecerli(
  imza: string | null,
  url: string,
  params: URLSearchParams
): boolean {
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!token || !imza) return false;

  const veri =
    url +
    [...params.keys()]
      .filter((k, i, arr) => arr.indexOf(k) === i)
      .sort()
      .map((k) => k + params.getAll(k).join(""))
      .join("");

  const beklenen = createHmac("sha1", token).update(veri, "utf8").digest("base64");
  return esit(imza, beklenen);
}

/** Meta: "sha256=" + hex(HMAC-SHA256(app secret, ham gövde)). */
export function metaImzaGecerli(imza: string | null, hamGovde: string): boolean {
  const secret = process.env.META_APP_SECRET;
  if (!secret || !imza) return false;

  const beklenen =
    "sha256=" + createHmac("sha256", secret).update(hamGovde, "utf8").digest("hex");
  return esit(imza, beklenen);
}

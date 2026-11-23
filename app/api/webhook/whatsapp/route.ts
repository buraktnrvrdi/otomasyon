import { NextRequest, NextResponse } from "next/server";
import { botYaniti } from "@/lib/anthropic/bot";
import { mesajGonder } from "@/lib/whatsapp/sender";
import { parseTwilioPayload, parseMetaPayload } from "@/lib/whatsapp/parser";

// Meta Cloud API webhook doğrulama
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// Gelen WhatsApp mesajını işle
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    let musteriNo: string;
    let metin: string;

    if (contentType.includes("application/x-www-form-urlencoded")) {
      // Twilio
      const form = await req.formData();
      const payload = parseTwilioPayload(form);
      if (!payload) return NextResponse.json({ ok: true });
      musteriNo = payload.from;
      metin = payload.text;
    } else {
      // Meta Cloud API
      const body = await req.json();
      const payload = parseMetaPayload(body);
      if (!payload) return NextResponse.json({ ok: true });
      musteriNo = payload.from;
      metin = payload.text;
    }

    if (!metin?.trim()) return NextResponse.json({ ok: true });

    // TODO: multi-tenant — isletme_id'yi telefon numarasından çöz
    const isletmeId = process.env.DEFAULT_ISLETME_ID ?? "";
    const yanitMetni = await botYaniti(musteriNo, metin, isletmeId);
    await mesajGonder(musteriNo, yanitMetni);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Webhook Error]", err);
    // 200 döndür — platform retry döngüsüne girmesin
    return NextResponse.json({ ok: true });
  }
}

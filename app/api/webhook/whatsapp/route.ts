import { NextRequest, NextResponse } from "next/server";
import { botYaniti } from "@/lib/anthropic/bot";
import { mesajGonder } from "@/lib/whatsapp/sender";
import { parseTwilioPayload, parseMetaPayload } from "@/lib/whatsapp/parser";
import type { WhatsAppMessage } from "@/lib/whatsapp/types";
import { createServerClient } from "@/lib/supabase/server";

async function isletmeBul(isletmeNo: string): Promise<string | null> {
  if (isletmeNo) {
    const supabase = await createServerClient();
    const { data } = await supabase
      .from("isletme")
      .select("id")
      .eq("whatsapp_no", isletmeNo)
      .maybeSingle();
    if (data?.id) return data.id;
  }
  return process.env.DEFAULT_ISLETME_ID || null;
}

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
    let payload: WhatsAppMessage | null;

    if (contentType.includes("application/x-www-form-urlencoded")) {
      payload = parseTwilioPayload(await req.formData());
    } else {
      payload = parseMetaPayload(await req.json());
    }

    if (!payload?.text) return NextResponse.json({ ok: true });

    const isletmeId = await isletmeBul(payload.to);
    if (!isletmeId) {
      console.error("[Webhook] Numaraya bagli isletme yok:", payload.to);
      return NextResponse.json({ ok: true });
    }

    const yanitMetni = await botYaniti(payload.from, payload.text, isletmeId);
    await mesajGonder(payload.from, yanitMetni, {
      numara: payload.to,
      phoneNumberId: payload.phoneNumberId,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Webhook Error]", err);
    // 200 döndür — platform retry döngüsüne girmesin
    return NextResponse.json({ ok: true });
  }
}

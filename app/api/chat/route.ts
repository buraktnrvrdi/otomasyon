import { NextRequest, NextResponse } from "next/server";
import { groqBotYaniti } from "@/lib/groq/bot";

export async function POST(req: NextRequest) {
  try {
    const { mesaj, oturum, isletme_id } = await req.json();

    if (!mesaj?.trim()) {
      return NextResponse.json({ hata: "Mesaj bos" }, { status: 400 });
    }

    if (!isletme_id) {
      return NextResponse.json({ hata: "Isletme belirtilmedi" }, { status: 400 });
    }

    const oturumId = oturum ?? "web-" + Math.random().toString(36).slice(2);
    const yanit = await groqBotYaniti(oturumId, mesaj, isletme_id);

    return NextResponse.json({ yanit, oturum: oturumId });
  } catch (err) {
    console.error("[Chat API Error]", err);
    return NextResponse.json({ hata: "Sunucu hatasi" }, { status: 500 });
  }
}

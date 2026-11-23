import { NextRequest, NextResponse } from "next/server";
import { botYaniti } from "@/lib/bot";
import { createServerClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAKS_MESAJ = 1000;

export async function POST(req: NextRequest) {
  try {
    const { mesaj, oturum, isletme_id } = await req.json();

    if (typeof mesaj !== "string" || !mesaj.trim()) {
      return NextResponse.json({ hata: "Mesaj bos" }, { status: 400 });
    }
    if (mesaj.length > MAKS_MESAJ) {
      return NextResponse.json({ hata: "Mesaj cok uzun" }, { status: 400 });
    }

    if (typeof isletme_id !== "string" || !UUID.test(isletme_id)) {
      return NextResponse.json({ hata: "Isletme belirtilmedi" }, { status: 400 });
    }

    const supabase = await createServerClient();
    const { data: isletme } = await supabase
      .from("isletme")
      .select("id")
      .eq("id", isletme_id)
      .maybeSingle();
    if (!isletme) {
      return NextResponse.json({ hata: "Isletme bulunamadi" }, { status: 404 });
    }

    // Oturum kimliği sadece sunucunun ürettiği biçimde kabul edilir; aksi halde
    // biri bir WhatsApp numarasını oturum diye gönderip o müşterinin
    // geçmişine ve randevularına erişebilirdi.
    const gecerliOturum =
      typeof oturum === "string" && oturum.startsWith("web-") && UUID.test(oturum.slice(4));
    const oturumId = gecerliOturum ? oturum : `web-${crypto.randomUUID()}`;

    const yanit = await botYaniti(oturumId, mesaj.trim(), isletme_id);

    return NextResponse.json({ yanit, oturum: oturumId });
  } catch (err) {
    console.error("[Chat API Error]", err);
    return NextResponse.json({ hata: "Sunucu hatasi" }, { status: 500 });
  }
}

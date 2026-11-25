import { after, NextRequest, NextResponse } from "next/server";
import { botYaniti } from "@/lib/bot";
import { mesajGonder } from "@/lib/whatsapp/sender";
import { parseTwilioPayload, parseMetaPayload, parseMetaDurumlari } from "@/lib/whatsapp/parser";
import type { WhatsAppDurum, WhatsAppMessage } from "@/lib/whatsapp/types";
import { metaImzaGecerli, twilioImzaGecerli } from "@/lib/whatsapp/signature";
import { createServerClient } from "@/lib/supabase/server";
import { botHakki, uyariGonderilsinMi, HATA_MESAJI, SINIR_MESAJI, YOGUN_MESAJI } from "@/lib/bot/koruma";
import { ilkKezMi } from "@/lib/tekrar";
import { uyar } from "@/lib/uyari";

// Cevap, yanıt gönderildikten sonra arka planda üretilir; model yavaşsa bile Meta zamanında 200 alır.
export const maxDuration = 60;

async function isletmeBul(isletmeNo: string, phoneNumberId?: string): Promise<string | null> {
  if (isletmeNo) {
    const supabase = await createServerClient();
    const { data } = await supabase
      .from("isletme")
      .select("id, meta_phone_number_id")
      .eq("whatsapp_no", isletmeNo)
      .maybeSingle();
    if (data?.id) {
      // Hatırlatmalar bu numaradan gönderilebilsin diye Meta kimliğini sakla.
      if (phoneNumberId && data.meta_phone_number_id !== phoneNumberId) {
        await supabase.from("isletme").update({ meta_phone_number_id: phoneNumberId }).eq("id", data.id);
      }
      return data.id;
    }
  }
  return process.env.DEFAULT_ISLETME_ID || null;
}

const DESTEKLENMEYEN_YANIT =
  "Şu an sadece yazılı mesajları anlayabiliyorum. Randevu için lütfen isteğinizi yazarak gönderin.";

/** Logda tam numara görünmesin: +9053****4567 */
function maskele(kimlik: string): string {
  if (kimlik.length <= 8) return kimlik;
  return kimlik.slice(0, 5) + "****" + kimlik.slice(-4);
}

/**
 * Meta, gönderdiğimiz her mesaj için ayrıca sent/delivered/read/failed bildirir.
 * Mesaj müşteriye ulaşmadığında nedenini Vercel loglarında bu satırlardan görürüz.
 */
function durumlariLogla(durumlar: WhatsAppDurum[]) {
  for (const d of durumlar) {
    const satir = `[WA durum] ${d.durum} id=${d.mesajId} alici=${maskele(d.alici)}`;
    if (d.durum === "failed") {
      const neden = d.hatalar
        .map((h) => `code=${h.kod ?? "?"} "${h.baslik}"${h.detay ? ` (${h.detay})` : ""}`)
        .join("; ");
      console.error(`${satir} ${neden || "neden belirtilmedi"}`);
      const kod = d.hatalar[0]?.kod ?? "bilinmiyor";
      void uyar(`WhatsApp mesajı teslim edilemedi (kod ${kod})`, d.hatalar[0]?.baslik ?? "", `teslim-${kod}`, 60);
    } else {
      console.log(satir);
    }
  }
}

/** Botun cevabını üretip müşteriye gönderir. Her hata yönetici uyarısına ve müşteriye kısa bir nota dönüşür. */
async function mesajiIsle(payload: WhatsAppMessage) {
  const gonderen = { numara: payload.to, phoneNumberId: payload.phoneNumberId };
  try {
    const isletmeId = await isletmeBul(payload.to, payload.phoneNumberId);
    if (!isletmeId) {
      console.error("[Webhook] Numaraya bagli isletme yok:", maskele(payload.to));
      return;
    }

    const hak = await botHakki(isletmeId, payload.from);
    if (hak !== "tamam") {
      if (hak === "salon") {
        await uyar("Salonun günlük bot mesaj sınırı doldu", `isletme=${isletmeId}`, `salon-sinir-${isletmeId}`, 360, isletmeId);
      }
      if (await uyariGonderilsinMi(isletmeId, payload.from)) {
        await mesajGonder(payload.from, hak === "salon" ? YOGUN_MESAJI : SINIR_MESAJI, gonderen);
      }
      return;
    }

    const yanitMetni = payload.text
      ? await botYaniti(payload.from, payload.text, isletmeId)
      : DESTEKLENMEYEN_YANIT;
    await mesajGonder(payload.from, yanitMetni, gonderen);
  } catch (err) {
    console.error("[Webhook Error]", err);
    await uyar("WhatsApp mesajı işlenemedi", err instanceof Error ? err.message : String(err), "webhook");
    // Müşteri cevapsız kalmasın; bu da başarısız olursa yapacak bir şey yok.
    try {
      await mesajGonder(payload.from, HATA_MESAJI, gonderen);
    } catch {}
  }
}

// Meta Cloud API webhook doğrulama
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const beklenen = process.env.WHATSAPP_VERIFY_TOKEN;
  if (mode === "subscribe" && beklenen && token === beklenen) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// Gelen WhatsApp mesajını işle
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    const hamGovde = await req.text();
    const imzaAtla =
      process.env.NODE_ENV !== "production" && process.env.WHATSAPP_IMZA_ATLA === "1";
    let payload: WhatsAppMessage | null;

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const params = new URLSearchParams(hamGovde);
      const url = process.env.WHATSAPP_WEBHOOK_URL || req.url;
      if (!imzaAtla && !twilioImzaGecerli(req.headers.get("x-twilio-signature"), url, params)) {
        console.error("[Webhook] Gecersiz Twilio imzasi");
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      payload = parseTwilioPayload(params);
    } else {
      if (!imzaAtla && !metaImzaGecerli(req.headers.get("x-hub-signature-256"), hamGovde)) {
        console.error("[Webhook] Gecersiz Meta imzasi");
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const govde = JSON.parse(hamGovde);
      durumlariLogla(parseMetaDurumlari(govde));
      payload = parseMetaPayload(govde);
    }

    if (!payload || (!payload.text && !payload.desteklenmeyen)) return NextResponse.json({ ok: true });

    // Meta aynı mesajı tekrar gönderebilir; ikinci kez işlenmesin.
    if (!(await ilkKezMi(payload.mesajId))) return NextResponse.json({ ok: true });

    const islenecek = payload;
    after(() => mesajiIsle(islenecek));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Webhook Error]", err);
    // 200 döndür — platform retry döngüsüne girmesin
    return NextResponse.json({ ok: true });
  }
}

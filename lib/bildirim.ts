import { after } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { sablonGonder } from "@/lib/whatsapp/sender";
import { uzunTarihMetni, yerelSaat } from "@/lib/utils/zaman";
import { uyar } from "@/lib/uyari";

/** Botun müşteri adına yaptığı işlemlerde berbere haber verir. */
export type BildirimOlayi =
  | { tur: "yeni"; musteri: string; hizmet: string; baslangic: Date }
  | { tur: "iptal"; musteri: string; hizmet: string; baslangic: Date }
  | { tur: "tasindi"; musteri: string; hizmet: string; baslangic: Date; eskiBaslangic: Date };

const BASLIK = {
  yeni: "Yeni randevu",
  iptal: "Randevu iptal edildi",
  tasindi: "Randevu değiştirildi",
} as const;

/** Şablon değişkenleri satır sonu, sekme ve art arda boşluk içeremez; uzunluk da sınırlıdır. */
const temizle = (s: string, en = 60) => s.replace(/\s+/g, " ").trim().slice(0, en) || "-";

const zamanMetni = (d: Date) => `${uzunTarihMetni(d)} ${yerelSaat(d)}`;

/**
 * İşlemi bekletmeden arka planda çalıştırır. Hiçbir hata müşterinin işlemini
 * bozmamalı; bildirim gönderilemezse sadece yönetici uyarısı düşer.
 */
export function bildirimiPlanla(isletmeId: string, olay: BildirimOlayi): void {
  const is = () => berbereBildir(isletmeId, olay);
  try {
    after(is);
  } catch {
    // İstek bağlamı dışında (ör. betik) doğrudan çalıştır.
    void is();
  }
}

export async function berbereBildir(isletmeId: string, olay: BildirimOlayi): Promise<void> {
  try {
    const db = await createServerClient();
    const { data: isletme } = await db.from("isletme").select("*").eq("id", isletmeId).maybeSingle();
    if (!isletme) return;

    const baslik = BASLIK[olay.tur];
    const zaman =
      olay.tur === "tasindi"
        ? `${zamanMetni(olay.eskiBaslangic)} yerine ${zamanMetni(olay.baslangic)}`
        : zamanMetni(olay.baslangic);

    // Ayar kolonları yoksa (migration 009 çalışmadıysa) varsayılanlar geçerli: e-posta açık, WhatsApp kapalı.
    const epostaAcik = isletme.bildirim_eposta_acik !== false;
    const waAcik = isletme.bildirim_whatsapp_acik === true && !!isletme.bildirim_whatsapp;

    const isler: Promise<unknown>[] = [];

    if (epostaAcik && process.env.RESEND_API_KEY && isletme.user_id) {
      isler.push(
        epostaGonder(db, isletme.user_id, {
          konu: `${baslik}: ${temizle(olay.musteri, 40)}, ${zamanMetni(olay.baslangic)}`,
          metin: `${baslik}\n\nMüşteri: ${temizle(olay.musteri, 100)}\nHizmet: ${temizle(olay.hizmet, 100)}\nZaman: ${zaman}\n\nRandevularını panelden görebilirsin.`,
        }).catch((err) => bildirimHatasi("e-posta", err, isletmeId))
      );
    }

    const sablon = process.env.WHATSAPP_BILDIRIM_SABLONU;
    if (waAcik && sablon) {
      isler.push(
        // Şablon: "Randevu bildirimi: {{1}}. Müşteri: {{2}}, hizmet: {{3}}, zaman: {{4}}. Detaylar panelde."
        sablonGonder(
          isletme.bildirim_whatsapp,
          sablon,
          [baslik, temizle(olay.musteri), temizle(olay.hizmet), temizle(zaman, 120)],
          {
            numara: isletme.whatsapp_no ?? undefined,
            phoneNumberId: isletme.meta_phone_number_id ?? undefined,
          }
        ).catch((err) => bildirimHatasi("WhatsApp", err, isletmeId))
      );
    }

    await Promise.all(isler);
  } catch (err) {
    await bildirimHatasi("hazırlık", err, isletmeId);
  }
}

async function bildirimHatasi(kanal: string, err: unknown, isletmeId: string) {
  await uyar(
    `Berbere bildirim gönderilemedi (${kanal})`,
    err instanceof Error ? err.message : String(err),
    `bildirim-${kanal}`,
    60,
    isletmeId
  );
}

async function epostaGonder(
  db: Awaited<ReturnType<typeof createServerClient>>,
  kullaniciId: string,
  { konu, metin }: { konu: string; metin: string }
) {
  const { data } = await db.auth.admin.getUserById(kullaniciId);
  const alici = data.user?.email;
  if (!alici) return;

  // Resend: https://resend.com. Kendi alan adını doğrulamadan yalnızca hesap sahibine gönderebilir.
  const res = await fetch(process.env.RESEND_API_URL || "https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.BILDIRIM_EPOSTA_GONDEREN || "Randevu Botu <onboarding@resend.dev>",
      to: [alici],
      subject: konu,
      text: metin,
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

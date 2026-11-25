import { createServerClient } from "@/lib/supabase/server";

export function epostaAyarliMi(): boolean {
  return !!process.env.RESEND_API_KEY;
}

/**
 * Salon sahibinin giriş e-postasına düz metin e-posta gönderir (Resend).
 * Kendi alan adını doğrulamadan Resend yalnızca hesap sahibinin adresine gönderebilir.
 * Alıcı bulunamazsa sessizce atlanır; gönderim hatasında fırlatır.
 */
export async function salonSahibineEpostaGonder(
  db: Awaited<ReturnType<typeof createServerClient>>,
  kullaniciId: string,
  { konu, metin }: { konu: string; metin: string }
): Promise<void> {
  const { data } = await db.auth.admin.getUserById(kullaniciId);
  const alici = data.user?.email;
  if (!alici) return;

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

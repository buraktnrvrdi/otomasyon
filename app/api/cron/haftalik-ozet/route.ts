import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { cronYetkiliMi } from "@/lib/cron-yetki";
import { gecmisleriTamamla } from "@/lib/randevu-durum";
import { epostaAyarliMi, salonSahibineEpostaGonder } from "@/lib/eposta";
import { haftalikOzetMetni } from "@/lib/haftalik-ozet";
import { siteTabani } from "@/lib/kvkk";
import { uyar } from "@/lib/uyari";

export const maxDuration = 60;

/** Her Pazartesi sabahı salon sahiplerine son 7 günün özetini e-postayla gönderir. */
export async function GET(req: NextRequest) {
  if (!cronYetkiliMi(req)) return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });
  if (!epostaAyarliMi()) return NextResponse.json({ atlandi: "RESEND_API_KEY ayarlanmamis" });

  // Özet, "tamamlandı" durumlarına dayanır; güncel olsun.
  await gecmisleriTamamla();

  const db = await createServerClient();
  const { data: salonlar, error } = await db
    .from("isletme")
    .select("*")
    .not("user_id", "is", null);
  if (error) return NextResponse.json({ hata: error.message }, { status: 500 });

  const hatalar: string[] = [];
  let gonderilen = 0;
  for (const salon of salonlar ?? []) {
    if (salon.ozet_eposta_acik === false) continue;
    try {
      const ozet = await haftalikOzetMetni(db, salon.id, salon.ad, siteTabani());
      if (!ozet) continue;
      await salonSahibineEpostaGonder(db, salon.user_id, ozet);
      gonderilen++;
    } catch (err) {
      hatalar.push(`${salon.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (hatalar.length) {
    await uyar(`${hatalar.length} haftalık özet e-postası gönderilemedi`, hatalar[0].slice(0, 300), "haftalik-ozet", 360);
  }
  return NextResponse.json({ salon: salonlar?.length ?? 0, gonderilen, hata: hatalar.length });
}

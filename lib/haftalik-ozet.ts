import { createServerClient } from "@/lib/supabase/server";
import { AKTIF_DURUMLAR } from "@/lib/randevu-durum";
import { gunEkle, haftaGunu, yerelAn, yerelSaat, yerelTarih } from "@/lib/utils/zaman";

const GUNLER = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
const AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

const gunAy = (t: string) => `${Number(t.slice(8, 10))} ${AYLAR[Number(t.slice(5, 7)) - 1]}`;
const para = (n: number) => `${n.toLocaleString("tr-TR")} ₺`;

interface Satir {
  baslangic: string;
  durum: string;
  hizmetler: { ad: string; fiyat: number | null } | null;
}

/**
 * Bir salonun son 7 günlük özetini ve önümüzdeki 7 günün durumunu düz metin olarak hazırlar.
 * Hiç randevu yoksa (ne geçen hafta ne gelecek hafta) null döner; boş e-posta gönderilmez.
 */
export async function haftalikOzetMetni(
  db: Awaited<ReturnType<typeof createServerClient>>,
  isletmeId: string,
  isletmeAdi: string,
  siteTabani: string
): Promise<{ konu: string; metin: string } | null> {
  const bugun = yerelTarih();
  const gecenBas = gunEkle(bugun, -7);
  const gelecekSon = gunEkle(bugun, 7);

  const { data } = await db
    .from("randevular")
    .select("baslangic, durum, hizmetler ( ad, fiyat )")
    .eq("isletme_id", isletmeId)
    .gte("baslangic", yerelAn(gecenBas, 0).toISOString())
    .lt("baslangic", yerelAn(gelecekSon, 0).toISOString())
    .order("baslangic", { ascending: true });

  const satirlar = (data ?? []) as unknown as Satir[];
  const bugunBas = yerelAn(bugun, 0).getTime();
  const gecen = satirlar.filter((r) => new Date(r.baslangic).getTime() < bugunBas);
  const gelecek = satirlar.filter(
    (r) => new Date(r.baslangic).getTime() >= bugunBas && (AKTIF_DURUMLAR as readonly string[]).includes(r.durum)
  );
  if (gecen.length === 0 && gelecek.length === 0) return null;

  const sayi = (d: string) => gecen.filter((r) => r.durum === d).length;
  const tamamlanan = gecen.filter((r) => r.durum === "tamamlandi");
  const iptal = sayi("iptal");
  const ciro = tamamlanan.reduce((t, r) => t + Number(r.hizmetler?.fiyat ?? 0), 0);

  const hizmetSayilari = new Map<string, number>();
  for (const r of tamamlanan) {
    const ad = r.hizmetler?.ad ?? "Silinmiş hizmet";
    hizmetSayilari.set(ad, (hizmetSayilari.get(ad) ?? 0) + 1);
  }
  const enCok = [...hizmetSayilari.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);

  const gunSayilari = new Map<number, number>();
  for (const r of gecen.filter((x) => x.durum !== "iptal")) {
    const g = haftaGunu(yerelTarih(new Date(r.baslangic)));
    gunSayilari.set(g, (gunSayilari.get(g) ?? 0) + 1);
  }
  const enYogun = [...gunSayilari.entries()].sort((a, b) => b[1] - a[1])[0];

  const satir: string[] = [
    `Haftalık özet: ${isletmeAdi}`,
    `${gunAy(gecenBas)} – ${gunAy(gunEkle(bugun, -1))}`,
    "",
    "Geçen hafta",
    `- Toplam randevu (iptaller hariç): ${gecen.length - iptal}`,
    `- Tamamlanan: ${tamamlanan.length}`,
    `- Gelmeyen: ${sayi("gelmedi")}`,
    `- İptal edilen: ${iptal}`,
    `- Tamamlanan randevulardan ciro: ${para(ciro)}`,
  ];
  if (enCok.length) satir.push(`- En çok yapılan hizmetler: ${enCok.map(([ad, n]) => `${ad} (${n})`).join(", ")}`);
  if (enYogun) satir.push(`- En yoğun gün: ${GUNLER[enYogun[0]]} (${enYogun[1]} randevu)`);

  satir.push("", "Önümüzdeki 7 gün", `- Planlı randevu: ${gelecek.length}`);
  if (gelecek[0]) {
    const ilk = new Date(gelecek[0].baslangic);
    const t = yerelTarih(ilk);
    satir.push(`- İlk randevu: ${GUNLER[haftaGunu(t)]} ${gunAy(t)} ${yerelSaat(ilk)}`);
  }

  if (siteTabani) satir.push("", `Detaylar için panele gir: ${siteTabani}/dashboard`);
  satir.push("", "Bu e-postayı kapatmak için Admin paneli > İşletme Bilgileri > Haftalık özet bölümünü kullan.");

  return { konu: `Haftalık özet: ${isletmeAdi}, ${gunAy(gecenBas)} – ${gunAy(gunEkle(bugun, -1))}`, metin: satir.join("\n") };
}

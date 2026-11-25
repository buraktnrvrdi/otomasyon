// Tüm takvim hesapları işletmenin saat diliminde yapılır; sunucunun (Vercel'de
// UTC) veya tarayıcının saat dilimine güvenilmez. Sunucu ve istemcide çalışır.

export const SAAT_DILIMI = "Europe/Istanbul";

const parcalayici = new Intl.DateTimeFormat("en-US", {
  timeZone: SAAT_DILIMI,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

export interface YerelZaman {
  yil: number;
  ay: number;
  gun: number;
  saat: number;
  dakika: number;
  saniye: number;
}

export function yerelParcalar(d: Date): YerelZaman {
  const p = Object.fromEntries(
    parcalayici.formatToParts(d).map((x) => [x.type, Number(x.value)])
  );
  return { yil: p.year, ay: p.month, gun: p.day, saat: p.hour, dakika: p.minute, saniye: p.second };
}

const iki = (n: number) => String(n).padStart(2, "0");

/** "YYYY-MM-DD" (işletme saatine göre) */
export function yerelTarih(d: Date = new Date()): string {
  const p = yerelParcalar(d);
  return `${p.yil}-${iki(p.ay)}-${iki(p.gun)}`;
}

/** "HH:mm" (işletme saatine göre) */
export function yerelSaat(d: Date): string {
  const p = yerelParcalar(d);
  return `${iki(p.saat)}:${iki(p.dakika)}`;
}

/** "dd.MM.yyyy HH:mm" (işletme saatine göre) */
export function tarihSaatMetni(d: Date): string {
  const p = yerelParcalar(d);
  return `${iki(p.gun)}.${iki(p.ay)}.${p.yil} ${iki(p.saat)}:${iki(p.dakika)}`;
}

/** "23 Kasım 2026 Pazartesi" (işletme saatine göre) */
export function uzunTarihMetni(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: SAAT_DILIMI,
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long",
  }).format(d);
}

/** Hatırlatma cümlesi için: "bugün", "yarın" ya da "27 Kasım Cuma günü" (işletme saatine göre) */
export function gorelGunMetni(d: Date, simdi: Date = new Date()): string {
  const hedef = yerelTarih(d);
  const bugun = yerelTarih(simdi);
  if (hedef === bugun) return "bugün";
  if (hedef === gunEkle(bugun, 1)) return "yarın";
  const metin = new Intl.DateTimeFormat("tr-TR", {
    timeZone: SAAT_DILIMI,
    day: "numeric",
    month: "long",
    weekday: "long",
  }).format(d);
  return `${metin} günü`;
}

/** Gün başından itibaren geçen dakika (işletme saatine göre) */
export function yerelDakika(d: Date): number {
  const p = yerelParcalar(d);
  return p.saat * 60 + p.dakika;
}

/** "YYYY-MM-DD" için haftanın günü: 0=Pazar ... 6=Cumartesi */
export function haftaGunu(tarih: string): number {
  const [y, m, g] = tarih.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, g)).getUTCDay();
}

/** "YYYY-MM-DD" tarihine n gün ekler */
export function gunEkle(tarih: string, n: number): string {
  const [y, m, g] = tarih.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1, g + n));
  return `${d.getUTCFullYear()}-${iki(d.getUTCMonth() + 1)}-${iki(d.getUTCDate())}`;
}

/**
 * İşletme saatindeki bir duvar saatini gerçek ana çevirir.
 * yerelAn("2026-11-24", 600) → 24 Kasım 10:00 İstanbul (07:00Z).
 */
export function yerelAn(tarih: string, dakika = 0): Date {
  const [y, m, g] = tarih.split("-").map(Number);
  const tahmin = Date.UTC(y, m - 1, g, 0, dakika);
  const fark = (an: number) => {
    const p = yerelParcalar(new Date(an));
    return Date.UTC(p.yil, p.ay - 1, p.gun, p.saat, p.dakika, p.saniye) - an;
  };
  // İkinci tur, yaz saati geçişlerinde ofsetin değiştiği durumu düzeltir.
  const ilk = tahmin - fark(tahmin);
  return new Date(tahmin - fark(ilk));
}

/** "HH:mm" → dakika; geçersizse null */
export function saatiDakikaya(saat: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(saat).trim());
  if (!m) return null;
  const s = Number(m[1]);
  const d = Number(m[2]);
  return s < 24 && d < 60 ? s * 60 + d : null;
}

const GUNLER = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

/** Bot için: "2026-11-23 Pazartesi 14:05" (işletme saatine göre) */
export function bugunMetni(simdi: Date = new Date()): string {
  const tarih = yerelTarih(simdi);
  return `${tarih} ${GUNLER[haftaGunu(tarih)]} ${yerelSaat(simdi)}`;
}

export function gecerliTarihMi(tarih: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(tarih))) return false;
  return gunEkle(tarih, 0) === tarih;
}

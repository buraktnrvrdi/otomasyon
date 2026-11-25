/**
 * Müşteri kimliği iki biçimde olabilir:
 * - telefon: "+905551234567"
 * - BSUID (Meta'nın işletmeye özel kullanıcı kimliği): "TR.1764119042096278".
 *   Kullanıcı adını açmış kişilerde Meta telefon numarasını göndermez.
 */
const BSUID = /^[A-Z]{2}\.[A-Za-z0-9]+$/;
const TELEFON = /^\+\d{8,15}$/;

export function bsuidMi(kimlik: string): boolean {
  return BSUID.test(kimlik);
}

export function telefonMu(kimlik: string): boolean {
  return TELEFON.test(kimlik);
}

/** WhatsApp üzerinden mesaj gönderilebilir bir kimlik mi (web oturumları değil) */
export function gonderilebilirMi(kimlik: string): boolean {
  return telefonMu(kimlik) || bsuidMi(kimlik);
}

/** Panelde gösterim: telefon aynen, BSUID için okunabilir bir etiket */
export function kimlikGoster(kimlik: string): string {
  if (bsuidMi(kimlik)) return "WhatsApp kullanıcısı (numara gizli)";
  if (kimlik.startsWith("web-")) return "Web test sohbeti";
  if (kimlik.startsWith("silindi-")) return "Silinmiş kayıt";
  return kimlik;
}

export const LOGO_BUCKET = "logolar";
export const MAKS_LOGO_BAYT = 2 * 1024 * 1024;
export const LOGO_TURLERI = ["image/png", "image/jpeg", "image/webp"];

export type LogoSonuc =
  | { ok: true; mime: string; uzanti: string }
  | { ok: false; hata: string };

/**
 * Dosya türü istemcinin söylediğine göre değil, ilk baytlara göre belirlenir.
 * SVG bilerek kabul edilmez (içine betik gömülebilir).
 */
export function logoDogrula(bayt: Uint8Array): LogoSonuc {
  if (bayt.length === 0) return { ok: false, hata: "Dosya bos." };
  if (bayt.length > MAKS_LOGO_BAYT) return { ok: false, hata: "Logo en fazla 2 MB olabilir." };

  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (png.every((b, i) => bayt[i] === b)) return { ok: true, mime: "image/png", uzanti: "png" };

  if (bayt[0] === 0xff && bayt[1] === 0xd8 && bayt[2] === 0xff) {
    return { ok: true, mime: "image/jpeg", uzanti: "jpg" };
  }

  const yazi = (bas: number, son: number) => String.fromCharCode(...bayt.slice(bas, son));
  if (yazi(0, 4) === "RIFF" && yazi(8, 12) === "WEBP") {
    return { ok: true, mime: "image/webp", uzanti: "webp" };
  }

  return { ok: false, hata: "Sadece PNG, JPG veya WebP yuklenebilir." };
}

/** Herkese açık logo adresinden depolama yolunu çıkarır (silme için). */
export function logoYoluBul(url: string | null | undefined): string | null {
  if (!url) return null;
  const isaret = `/object/public/${LOGO_BUCKET}/`;
  const i = url.indexOf(isaret);
  return i === -1 ? null : decodeURIComponent(url.slice(i + isaret.length).split("?")[0]);
}

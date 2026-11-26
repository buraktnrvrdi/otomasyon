/**
 * Müşteriye ya da salon sahibine WhatsApp'tan kendiliğinden (karşı taraf yazmadan)
 * mesaj gönderme özelliği. Varsayılan KAPALI: uygulama yalnızca gelen mesajlara
 * cevap verir. Açmak için NEXT_PUBLIC_PROAKTIF_MESAJLAR=acik ayarla (ve onaylı
 * şablonları tanımla). Bu mesajlar Meta'da ücretlidir.
 */
export const PROAKTIF_MESAJLAR_ACIK = process.env.NEXT_PUBLIC_PROAKTIF_MESAJLAR === "acik";

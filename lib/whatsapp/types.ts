export interface WhatsAppMessage {
  from: string;
  text: string;
  /** İşletmenin mesajı alan numarası, "+90..." biçiminde */
  to: string;
  /** Meta Cloud API'de cevabın gönderileceği numara kimliği */
  phoneNumberId?: string;
  /** Mesaj metin değilse türü (audio, image, location...); bot bu durumda kısa bir uyarı gönderir. */
  desteklenmeyen?: string;
}

export interface WhatsAppDurum {
  /** sent | delivered | read | failed */
  durum: string;
  mesajId: string;
  alici: string;
  hatalar: { kod?: number; baslik: string; detay?: string }[];
}

export interface WhatsAppMessage {
  from: string;
  text: string;
  /** İşletmenin mesajı alan numarası, "+90..." biçiminde */
  to: string;
  /** Meta Cloud API'de cevabın gönderileceği numara kimliği */
  phoneNumberId?: string;
}

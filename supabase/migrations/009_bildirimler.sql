-- Berbere "yeni randevu" bildirimi ayarları. Tekrar çalıştırmak güvenlidir.
--   bildirim_eposta_acik: randevu olaylarını hesap e-postasına gönder (varsayılan açık)
--   bildirim_whatsapp:    berberin kişisel WhatsApp numarası (bot numarasından farklı)
--   bildirim_whatsapp_acik: bu numaraya onaylı şablonla bildirim gönder

ALTER TABLE isletme ADD COLUMN IF NOT EXISTS bildirim_eposta_acik BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE isletme ADD COLUMN IF NOT EXISTS bildirim_whatsapp TEXT;
ALTER TABLE isletme ADD COLUMN IF NOT EXISTS bildirim_whatsapp_acik BOOLEAN NOT NULL DEFAULT FALSE;

-- Randevu hatırlatmaları: her randevuya tek hatırlatma gider.
ALTER TABLE randevular ADD COLUMN IF NOT EXISTS hatirlatma_gonderildi_at TIMESTAMPTZ;

-- Meta Cloud API'de işletmenin numarasından mesaj göndermek için gereken kimlik.
-- İşletmenin numarasına ilk mesaj geldiğinde webhook tarafından otomatik doldurulur.
ALTER TABLE isletme ADD COLUMN IF NOT EXISTS meta_phone_number_id TEXT;

-- Müşteri notları (salonun müşteri hakkında tuttuğu özel notlar) ve haftalık özet e-postası ayarı.
-- Tekrar çalıştırmak güvenlidir.

CREATE TABLE IF NOT EXISTS musteri_notlari (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  isletme_id        UUID NOT NULL REFERENCES isletme(id) ON DELETE CASCADE,
  musteri_whatsapp  TEXT NOT NULL,
  notu              TEXT NOT NULL,
  guncellendi_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (isletme_id, musteri_whatsapp)
);

ALTER TABLE musteri_notlari ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all" ON musteri_notlari;
CREATE POLICY "service_role_all" ON musteri_notlari
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Haftalık özet e-postası (varsayılan açık)
ALTER TABLE isletme ADD COLUMN IF NOT EXISTS ozet_eposta_acik BOOLEAN NOT NULL DEFAULT TRUE;

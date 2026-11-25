-- Tatil ve izin günleri: tüm gün kapalı ya da belirli saatlerde (ör. öğle arası) randevu verilmez.
-- Bir kayıt bir tarih aralığını kapsar; saat alanları doluysa her gün için o saat aralığı kapalıdır.
-- Tekrar çalıştırmak güvenlidir.

CREATE TABLE IF NOT EXISTS kapali_gunler (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  isletme_id       UUID NOT NULL REFERENCES isletme(id) ON DELETE CASCADE,
  baslangic_tarih  DATE NOT NULL,
  bitis_tarih      DATE NOT NULL,
  baslangic_saat   TIME,
  bitis_saat       TIME,
  aciklama         TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT kapali_gunler_tarih_sirasi CHECK (bitis_tarih >= baslangic_tarih),
  CONSTRAINT kapali_gunler_saat_cifti CHECK ((baslangic_saat IS NULL) = (bitis_saat IS NULL)),
  CONSTRAINT kapali_gunler_saat_sirasi CHECK (baslangic_saat IS NULL OR bitis_saat > baslangic_saat)
);

CREATE INDEX IF NOT EXISTS idx_kapali_gunler ON kapali_gunler(isletme_id, bitis_tarih);

ALTER TABLE kapali_gunler ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all" ON kapali_gunler;
CREATE POLICY "service_role_all" ON kapali_gunler
  FOR ALL TO service_role USING (true) WITH CHECK (true);

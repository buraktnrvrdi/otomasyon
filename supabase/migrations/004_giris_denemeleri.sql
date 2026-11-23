-- Süper admin girişinde başarısız denemeleri sayarak kaba kuvvet saldırısını sınırlar.

CREATE TABLE IF NOT EXISTS giris_denemeleri (
  id      BIGSERIAL PRIMARY KEY,
  anahtar TEXT NOT NULL,
  zaman   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_giris_denemeleri ON giris_denemeleri(anahtar, zaman);

ALTER TABLE giris_denemeleri ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all" ON giris_denemeleri;
CREATE POLICY "service_role_all" ON giris_denemeleri
  FOR ALL TO service_role USING (true) WITH CHECK (true);

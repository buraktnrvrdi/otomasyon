-- Sistem uyarıları: süper admin panelinde gösterilir (token süresi doldu, mesaj teslim edilemedi vb.).
-- Aynı konuda okunmamış uyarı varsa yeni satır açılmaz, sayacı (adet) artar.
-- Tekrar çalıştırmak güvenlidir.

CREATE TABLE IF NOT EXISTS uyarilar (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  konu            TEXT NOT NULL,
  baslik          TEXT NOT NULL,
  detay           TEXT,
  isletme_id      UUID REFERENCES isletme(id) ON DELETE SET NULL,
  adet            INT NOT NULL DEFAULT 1,
  okundu          BOOLEAN NOT NULL DEFAULT FALSE,
  olusturuldu_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  son_olusma_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uyarilar_acik_konu ON uyarilar(konu) WHERE NOT okundu;
CREATE INDEX IF NOT EXISTS idx_uyarilar_liste ON uyarilar(okundu, son_olusma_at DESC);

ALTER TABLE uyarilar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all" ON uyarilar;
CREATE POLICY "service_role_all" ON uyarilar
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================
-- TABLO 1: isletme
-- =============================================
CREATE TABLE isletme (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad          TEXT NOT NULL,
  telefon     TEXT,
  adres       TEXT,
  whatsapp_no TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLO 2: hizmetler
-- =============================================
CREATE TABLE hizmetler (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  isletme_id  UUID REFERENCES isletme(id) ON DELETE CASCADE,
  ad          TEXT NOT NULL,
  sure_dakika INT  NOT NULL,
  fiyat       NUMERIC(10,2),
  aktif       BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLO 3: calisma_saatleri
-- =============================================
CREATE TABLE calisma_saatleri (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  isletme_id   UUID REFERENCES isletme(id) ON DELETE CASCADE,
  gun          SMALLINT NOT NULL,  -- 0=Pazar, 1=Pazartesi ... 6=Cumartesi
  acilis       TIME NOT NULL,
  kapanis      TIME NOT NULL,
  kapali       BOOLEAN DEFAULT FALSE,
  UNIQUE(isletme_id, gun)
);

-- =============================================
-- TABLO 4: randevular
-- =============================================
CREATE TABLE randevular (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  isletme_id       UUID REFERENCES isletme(id) ON DELETE CASCADE,
  hizmet_id        UUID REFERENCES hizmetler(id),
  musteri_ad       TEXT NOT NULL,
  musteri_whatsapp TEXT NOT NULL,
  baslangic        TIMESTAMPTZ NOT NULL,
  bitis            TIMESTAMPTZ NOT NULL,
  durum            TEXT DEFAULT 'beklemede'
                   CHECK (durum IN ('beklemede','onaylandi','iptal','tamamlandi')),
  notlar           TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_randevular_baslangic ON randevular(isletme_id, baslangic);
CREATE INDEX idx_randevular_whatsapp  ON randevular(musteri_whatsapp);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE isletme          ENABLE ROW LEVEL SECURITY;
ALTER TABLE hizmetler        ENABLE ROW LEVEL SECURITY;
ALTER TABLE calisma_saatleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE randevular       ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON isletme
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all" ON hizmetler
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all" ON calisma_saatleri
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all" ON randevular
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "anon_read_randevular" ON randevular
  FOR SELECT TO anon USING (true);

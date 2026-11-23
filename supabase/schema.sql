-- =============================================
-- TABLO 1: isletme
-- =============================================
CREATE TABLE isletme (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad          TEXT NOT NULL,
  telefon     TEXT,
  adres       TEXT,
  whatsapp_no TEXT UNIQUE,
  ikon        TEXT DEFAULT '🏪',
  user_id     UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
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
                   CONSTRAINT randevular_durum_check
                   CHECK (durum IN ('beklemede','onaylandi','iptal','tamamlandi','gelmedi')),
  notlar           TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_randevular_baslangic ON randevular(isletme_id, baslangic);
CREATE INDEX idx_randevular_whatsapp  ON randevular(musteri_whatsapp);

-- =============================================
-- TABLO 5: davet_kodlari
-- =============================================
CREATE TABLE davet_kodlari (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kod            TEXT NOT NULL UNIQUE,
  kullanildi     BOOLEAN DEFAULT FALSE,
  olusturuldu_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLO 6: konusmalar (bot sohbet geçmişi)
-- =============================================
CREATE TABLE konusmalar (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  isletme_id     UUID REFERENCES isletme(id) ON DELETE CASCADE,
  musteri_no     TEXT NOT NULL,
  mesajlar       JSONB NOT NULL DEFAULT '[]'::jsonb,
  guncellendi_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(isletme_id, musteri_no)
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE isletme          ENABLE ROW LEVEL SECURITY;
ALTER TABLE hizmetler        ENABLE ROW LEVEL SECURITY;
ALTER TABLE calisma_saatleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE randevular       ENABLE ROW LEVEL SECURITY;
ALTER TABLE davet_kodlari    ENABLE ROW LEVEL SECURITY;
ALTER TABLE konusmalar       ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON isletme
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all" ON hizmetler
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all" ON calisma_saatleri
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all" ON randevular
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all" ON davet_kodlari
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all" ON konusmalar
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================
-- TABLO 1: isletme
-- =============================================
CREATE TABLE isletme (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad          TEXT NOT NULL,
  telefon     TEXT,
  adres       TEXT,
  whatsapp_no TEXT UNIQUE,
  ikon        TEXT DEFAULT 'makas',
  logo_url    TEXT,
  meta_phone_number_id TEXT,
  bildirim_eposta_acik   BOOLEAN NOT NULL DEFAULT TRUE,
  bildirim_whatsapp      TEXT,
  bildirim_whatsapp_acik BOOLEAN NOT NULL DEFAULT FALSE,
  ozet_eposta_acik       BOOLEAN NOT NULL DEFAULT TRUE,
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
  hatirlatma_gonderildi_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Aynı işletmede zamanı çakışan iki aktif randevu olamaz
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE randevular ADD CONSTRAINT randevular_cakisma_yok
  EXCLUDE USING gist (isletme_id WITH =, tstzrange(baslangic, bitis, '[)') WITH &&)
  WHERE (durum IN ('beklemede', 'onaylandi'));

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
-- TABLO 7: giris_denemeleri (super admin kaba kuvvet sınırı)
-- =============================================
CREATE TABLE giris_denemeleri (
  id      BIGSERIAL PRIMARY KEY,
  anahtar TEXT NOT NULL,
  zaman   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_giris_denemeleri ON giris_denemeleri(anahtar, zaman);

-- =============================================
-- TABLO 8: islenen_mesajlar (WhatsApp mesaj tekrar kontrolü)
-- =============================================
CREATE TABLE islenen_mesajlar (
  mesaj_id        TEXT PRIMARY KEY,
  olusturuldu_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_islenen_mesajlar_zaman ON islenen_mesajlar(olusturuldu_at);

-- =============================================
-- TABLO 9: uyarilar (süper admin panelinde gösterilen sistem uyarıları)
-- =============================================
CREATE TABLE uyarilar (
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

CREATE UNIQUE INDEX uyarilar_acik_konu ON uyarilar(konu) WHERE NOT okundu;
CREATE INDEX idx_uyarilar_liste ON uyarilar(okundu, son_olusma_at DESC);

-- =============================================
-- TABLO 10: kapali_gunler (tatil / izin günleri ve saatleri)
-- =============================================
CREATE TABLE kapali_gunler (
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

CREATE INDEX idx_kapali_gunler ON kapali_gunler(isletme_id, bitis_tarih);

-- =============================================
-- TABLO 11: musteri_notlari (salonun müşteri hakkında tuttuğu notlar)
-- =============================================
CREATE TABLE musteri_notlari (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  isletme_id        UUID NOT NULL REFERENCES isletme(id) ON DELETE CASCADE,
  musteri_whatsapp  TEXT NOT NULL,
  notu              TEXT NOT NULL,
  guncellendi_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (isletme_id, musteri_whatsapp)
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
ALTER TABLE giris_denemeleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE islenen_mesajlar ENABLE ROW LEVEL SECURITY;
ALTER TABLE uyarilar ENABLE ROW LEVEL SECURITY;
ALTER TABLE kapali_gunler ENABLE ROW LEVEL SECURITY;
ALTER TABLE musteri_notlari ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "service_role_all" ON giris_denemeleri
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all" ON islenen_mesajlar
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all" ON uyarilar
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all" ON kapali_gunler
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all" ON musteri_notlari
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================
-- STORAGE: salon logoları (herkese açık okuma, yükleme sadece sunucudan)
-- =============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('logolar', 'logolar', true, 2097152, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

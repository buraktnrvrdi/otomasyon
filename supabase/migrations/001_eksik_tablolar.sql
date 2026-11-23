-- Mevcut bir veritabanını schema.sql ile eşitler. Tekrar çalıştırmak güvenlidir.

ALTER TABLE isletme ALTER COLUMN whatsapp_no DROP NOT NULL;
ALTER TABLE isletme ADD COLUMN IF NOT EXISTS ikon TEXT DEFAULT '🏪';
ALTER TABLE isletme ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS davet_kodlari (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kod            TEXT NOT NULL UNIQUE,
  kullanildi     BOOLEAN DEFAULT FALSE,
  olusturuldu_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS konusmalar (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  isletme_id     UUID REFERENCES isletme(id) ON DELETE CASCADE,
  musteri_no     TEXT NOT NULL,
  mesajlar       JSONB NOT NULL DEFAULT '[]'::jsonb,
  guncellendi_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(isletme_id, musteri_no)
);

ALTER TABLE davet_kodlari ENABLE ROW LEVEL SECURITY;
ALTER TABLE konusmalar    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all" ON davet_kodlari;
CREATE POLICY "service_role_all" ON davet_kodlari
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all" ON konusmalar;
CREATE POLICY "service_role_all" ON konusmalar
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Herkese açık anahtarla tüm randevuların (isim, telefon) okunmasını engeller.
DROP POLICY IF EXISTS "anon_read_randevular" ON randevular;

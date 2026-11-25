-- WhatsApp mesaj kimliklerini saklar: Meta aynı mesajı tekrar gönderirse ikinci kez işlenmez.
-- Tekrar çalıştırmak güvenlidir. Eski kayıtlar günlük görevle silinir.

CREATE TABLE IF NOT EXISTS islenen_mesajlar (
  mesaj_id        TEXT PRIMARY KEY,
  olusturuldu_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_islenen_mesajlar_zaman ON islenen_mesajlar(olusturuldu_at);

ALTER TABLE islenen_mesajlar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all" ON islenen_mesajlar;
CREATE POLICY "service_role_all" ON islenen_mesajlar
  FOR ALL TO service_role USING (true) WITH CHECK (true);

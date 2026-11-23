-- Aynı işletmede zamanı çakışan iki aktif randevuyu veritabanı düzeyinde engeller.
-- Uygulama kontrolleri aynı anda gelen iki isteği yakalayamaz; bu kısıt yakalar.
-- Mevcut verilerde çakışan aktif randevu varsa ALTER hata verir; önce onları düzeltin:
--   SELECT a.id, b.id FROM randevular a JOIN randevular b
--     ON a.isletme_id = b.isletme_id AND a.id < b.id
--    AND tstzrange(a.baslangic, a.bitis) && tstzrange(b.baslangic, b.bitis)
--    AND a.durum IN ('beklemede','onaylandi') AND b.durum IN ('beklemede','onaylandi');

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE randevular DROP CONSTRAINT IF EXISTS randevular_cakisma_yok;
ALTER TABLE randevular ADD CONSTRAINT randevular_cakisma_yok
  EXCLUDE USING gist (isletme_id WITH =, tstzrange(baslangic, bitis, '[)') WITH &&)
  WHERE (durum IN ('beklemede', 'onaylandi'));

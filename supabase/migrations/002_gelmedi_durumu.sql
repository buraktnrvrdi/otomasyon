-- Randevu durumlarına "gelmedi" ekler. Tekrar çalıştırmak güvenlidir.

ALTER TABLE randevular DROP CONSTRAINT IF EXISTS randevular_durum_check;
ALTER TABLE randevular ADD CONSTRAINT randevular_durum_check
  CHECK (durum IN ('beklemede','onaylandi','iptal','tamamlandi','gelmedi'));

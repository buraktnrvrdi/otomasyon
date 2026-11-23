-- Test verisi: Örnek bir kuaför işletmesi
-- Bu UUID'leri .env.local içindeki ISLETME_ID olarak kullan

INSERT INTO isletme (id, ad, telefon, adres, whatsapp_no) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Stil Kuaför',
  '+90 212 555 0100',
  'Kadıköy, İstanbul',
  '+905551234567'
);

INSERT INTO hizmetler (isletme_id, ad, sure_dakika, fiyat) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Saç Kesimi',      30, 200.00),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Sakal Tıraşı',    20, 100.00),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Saç + Sakal',     45, 280.00),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Saç Boyama',      90, 500.00),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Fön',             30, 150.00);

-- Çalışma saatleri: Pazartesi-Cumartesi 09:00-19:00, Pazar kapalı
INSERT INTO calisma_saatleri (isletme_id, gun, acilis, kapanis, kapali) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 0, '09:00', '19:00', TRUE),   -- Pazar (kapalı)
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 1, '09:00', '19:00', FALSE),  -- Pazartesi
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 2, '09:00', '19:00', FALSE),  -- Salı
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 3, '09:00', '19:00', FALSE),  -- Çarşamba
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 4, '09:00', '19:00', FALSE),  -- Perşembe
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 5, '09:00', '19:00', FALSE),  -- Cuma
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 6, '10:00', '17:00', FALSE);  -- Cumartesi

-- Salon logosu: adres isletme.logo_url'de, dosya herkese açık "logolar" bucket'ında durur.
-- Yükleme yalnızca sunucudan (service role) yapılır; herkes okuyabilir.
-- Tekrar çalıştırmak güvenlidir.

ALTER TABLE isletme ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Simgeler artık emoji değil anahtar olarak saklanır; eski emoji değerleri uygulamada çevrilir.
ALTER TABLE isletme ALTER COLUMN ikon SET DEFAULT 'makas';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('logolar', 'logolar', true, 2097152, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO UPDATE
  SET public = true,
      file_size_limit = 2097152,
      allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp'];

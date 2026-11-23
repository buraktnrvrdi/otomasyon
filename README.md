# Otomasyon: WhatsApp Randevu Botu

Kuaför ve berber salonları için WhatsApp üzerinden randevu alan bir bot ve salon yönetim paneli.

- **Müşteri:** Salonun WhatsApp numarasına yazar. Bot boş saatleri gösterir, randevu alır, iptal eder.
- **Salon (admin):** `/admin` ve `/dashboard` sayfalarından hizmetleri, çalışma saatlerini ve randevuları yönetir.
- **Süper admin:** `/super` sayfasından yeni salonlar için davet kodu üretir.
- **Web test sohbeti:** `/chat` (admin girişliyken) ve `/<isletme_id>` adresleri, WhatsApp'taki botun aynısıdır; test için kullanılır.

Teknolojiler: Next.js 16, Supabase (Postgres + Auth), Groq veya Anthropic (bot), Twilio veya Meta Cloud API (WhatsApp).

## Yerelde çalıştırma

```bash
npm install
cp .env.local.example .env.local   # değerleri doldur
npm run dev
```

## Canlıya alma kontrol listesi

### 1. Supabase

Yeni bir veritabanı için SQL Editor'de `supabase/schema.sql` dosyasını çalıştır. İstersen ardından `supabase/seed.sql` ile örnek veri ekle.

Mevcut veritabanı için `supabase/migrations/` altındaki dosyaları **sırayla** çalıştır. Hepsini tekrar çalıştırmak güvenlidir.

| Dosya | Ne yapar |
| --- | --- |
| `001_eksik_tablolar.sql` | Eksik tablo ve kolonları ekler, herkese açık randevu okuma iznini kaldırır |
| `002_gelmedi_durumu.sql` | "Gelmedi" durumunu ekler |
| `003_cift_randevu_kilidi.sql` | Çakışan iki aktif randevuyu veritabanında engeller. Çakışan kayıt varsa hata verir; dosyanın başındaki sorguyla onları bul |
| `004_giris_denemeleri.sql` | Süper admin girişi için deneme sınırı tablosu |
| `005_hatirlatma.sql` | Hatırlatma ve Meta numara kimliği kolonları |
| `006_salon_logo.sql` | Salon logosu kolonu, simge varsayılanı ve herkese açık `logolar` depolama alanı |

### 2. Vercel

1. Repoyu Vercel'e bağla.
2. `.env.local.example` dosyasındaki değişkenleri Project Settings > Environment Variables altına gir. Özellikle:
   - `SUPER_ADMIN_PASSWORD`: en az 12 karakter.
   - `CRON_SECRET`: uzun, rastgele bir değer. Hatırlatma görevi bunsuz çalışmaz.
   - `BOT_SAGLAYICI`: `groq` ya da `anthropic`. Anthropic seçersen hesapta kredi olmalı. Model adı hata verirse `ANTHROPIC_MODEL` ile değiştir (ör. `claude-sonnet-5-5`).
3. Deploy et. `vercel.json` içindeki görev her gün 09:00'da (İstanbul) çalışır, hatırlatmaları gönderir ve saati geçmiş randevuları "tamamlandı" yapar.

### 3. WhatsApp

Webhook adresi: `https://<alan-adin>/api/webhook/whatsapp`

**Twilio**

1. Twilio Console > Messaging > WhatsApp Sandbox (test) ya da onaylı bir WhatsApp göndericisi (canlı).
2. "When a message comes in" alanına webhook adresini gir, yöntem: `POST`.
3. `WHATSAPP_PROVIDER=twilio`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` değerlerini gir.

**Meta Cloud API**

1. Meta for Developers'da bir uygulama oluştur, WhatsApp ürününü ekle ve işletme doğrulamasını tamamla.
2. Webhook adresini ve `WHATSAPP_VERIFY_TOKEN` değerini gir, `messages` alanına abone ol.
3. `WHATSAPP_PROVIDER=meta`, `META_ACCESS_TOKEN` (kalıcı sistem kullanıcısı token'ı), `META_PHONE_NUMBER_ID` ve **`META_APP_SECRET`** değerlerini gir. `META_APP_SECRET` olmadan tüm mesajlar reddedilir.

**Her salon için:** Admin paneli > İşletme Bilgileri > "WhatsApp Bot Numarası" alanına, müşterilerin yazacağı numarayı `+90...` biçiminde gir. Gelen mesajlar bu numaraya göre doğru salona yönlenir.

### 4. Hatırlatma şablonu (isteğe bağlı)

WhatsApp, müşteri son 24 saatte yazmadıysa serbest mesaja izin vermez. Hatırlatma için onaylı bir şablon gerekir. Örnek metin:

> Merhaba {{1}}, {{2}} randevunuzu hatırlatırız: {{3}} saat {{4}} ({{5}}). Gelemeyecekseniz bu mesaja yazarak iptal edebilirsiniz.

Değişkenler sırasıyla müşteri adı, salon adı, tarih, saat ve hizmettir.

- **Meta:** WhatsApp Manager > Message templates altında, "Utility" kategorisinde, Türkçe dilinde oluştur. Şablon adını `WHATSAPP_HATIRLATMA_SABLONU` değerine yaz.
- **Twilio:** Content Template Builder'da oluşturup WhatsApp onayına gönder. Content SID'yi (`HX...`) `WHATSAPP_HATIRLATMA_SABLONU` değerine yaz.

`WHATSAPP_HATIRLATMA_SABLONU` boş bırakılırsa hatırlatma gönderilmez, uygulamanın geri kalanı normal çalışır.

## Önemli davranışlar

- **Saatler:** Tüm takvim hesapları `Europe/Istanbul` saatine göre yapılır; sunucunun saat dilimi önemli değildir.
- **Durumlar:** Bitiş saati geçen randevular otomatik "tamamlandı" olur. Admin isterse "Gelmedi" olarak işaretleyebilir.
- **Güvenlik:** Admin API'leri her istekte Supabase oturumunu doğrular. WhatsApp webhook'u imza doğrulamasından geçmeyen istekleri reddeder. Bot, müşteri numarasını modelden değil sunucudan alır.

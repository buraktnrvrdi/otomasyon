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
| `007_mesaj_tekrar_kontrolu.sql` | WhatsApp mesaj tekrar kontrolü (`islenen_mesajlar`) |
| `008_uyarilar.sql` | Süper admin panelinde gösterilen sistem uyarıları (`uyarilar`) |

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

1. Meta for Developers'da Business tipinde bir uygulama oluştur ve WhatsApp ürününü ekle. WhatsApp > API Setup sayfasından `Phone number ID` ve `WhatsApp Business Account ID` (WABA) değerlerini al.
2. **Kalıcı token:** Business Settings > Users > System users > yeni sistem kullanıcısı. Uygulamayı ve WhatsApp hesabını ona ata, `whatsapp_business_messaging` ve `whatsapp_business_management` izinleriyle süresiz token üret. API Setup sayfasındaki geçici token birkaç saatte biter, canlıda kullanma.
3. Vercel'e `WHATSAPP_PROVIDER=meta`, `META_ACCESS_TOKEN`, `META_PHONE_NUMBER_ID` ve **`META_APP_SECRET`** (App settings > Basic) değerlerini gir ve yeniden deploy et. `META_APP_SECRET` olmadan tüm mesajlar reddedilir.
4. WhatsApp > Configuration: webhook adresini ve `WHATSAPP_VERIFY_TOKEN` değerini gir, "Verify and save", sonra `messages` alanına abone ol.
5. **WABA'yı uygulamaya bağla** (atlanırsa Meta mesajları webhook'a hiç göndermez). Token'ı kimseyle paylaşmadan kendi terminalinde çalıştır:

   ```bash
   curl -X POST "https://graph.facebook.com/v24.0/WABA_ID/subscribed_apps" -H "Authorization: Bearer TOKEN"
   ```

6. Test numarası kullanıyorsan mesaj atacak telefonları API Setup > "To" listesine ekleyip doğrula. Test numarası yalnızca bu listeye yazabilir (hata `131030`).

**Mesaj gitmiyorsa:** Vercel > Logs'ta `[WA` ile ara.

- `[WA gonderildi] id=...`: Meta mesajı kabul etti.
- `[WA durum] delivered` / `read`: mesaj telefona ulaştı.
- `[WA durum] failed code=... "..."`: Meta mesajı teslim edemedi; kod ve açıklama nedeni söyler (ör. `131030` izinli listede değil, `131047` 24 saat penceresi kapalı, `131042` ödeme yöntemi eksik).
- Hiç `[WA` satırı yoksa istek webhook'a gelmiyor: 4. ve 5. adımları kontrol et.

**Her salon için:** Admin paneli > İşletme Bilgileri > "WhatsApp Bot Numarası" alanına, müşterilerin yazacağı numarayı `+90...` biçiminde gir. Gelen mesajlar bu numaraya göre doğru salona yönlenir.

### 4. Hatırlatma şablonu (isteğe bağlı)

WhatsApp, müşteri son 24 saatte yazmadıysa serbest mesaja izin vermez. Hatırlatma için onaylı bir şablon gerekir. Örnek metin:

> Merhaba {{1}}, {{2}} randevunuzu hatırlatırız: {{3}} saat {{4}} ({{5}}). Gelemeyecekseniz bu mesaja yazarak iptal edebilirsiniz.

Değişkenler sırasıyla müşteri adı, salon adı, tarih, saat ve hizmettir.

- **Meta:** WhatsApp Manager > Message templates altında, "Utility" kategorisinde, Türkçe dilinde oluştur. Şablon adını `WHATSAPP_HATIRLATMA_SABLONU` değerine yaz.
- **Twilio:** Content Template Builder'da oluşturup WhatsApp onayına gönder. Content SID'yi (`HX...`) `WHATSAPP_HATIRLATMA_SABLONU` değerine yaz.

`WHATSAPP_HATIRLATMA_SABLONU` boş bırakılırsa hatırlatma gönderilmez, uygulamanın geri kalanı normal çalışır.

### 5. Hata uyarıları

Bot ya da WhatsApp bağlantısı bozulduğunda (token süresi dolması, mesaj teslim hatası, model hatası, şifre e-postası gitmemesi) uyarı **süper admin panelinde** (`/super`, "Sistem uyarıları") görünür. Aynı konudaki okunmamış uyarılar tek satırda toplanır ve "kaç kez" sayacı artar; "Okundu" dedikten sonra aynı sorun tekrar olursa yeniden uyarı düşer. Panel açıkken 30 saniyede bir kendini günceller. Okunmuş uyarılar 30 gün sonra silinir.

Paneli açmadığın zamanlarda da haberdar olmak istersen isteğe bağlı bir dış kanal ekleyebilirsin (aynı konu için 15 dakikada en fazla bir bildirim):

- **Telegram:** @BotFather ile bir bot oluştur, `TELEGRAM_BOT_TOKEN` değerini al. Bota bir mesaj yazıp `https://api.telegram.org/bot<TOKEN>/getUpdates` adresinden `chat.id` değerini bul ve `TELEGRAM_CHAT_ID` olarak gir.
- **Slack / Discord:** gelen-webhook adresini `UYARI_WEBHOOK_URL` olarak gir.

### 6. Şifre sıfırlama e-postası

"Şifreni mi unuttun?" akışı Supabase'in e-postasını kullanır. Çalışması için:

1. **Authentication > URL Configuration:** "Site URL" alanına canlı adresi yaz, "Redirect URLs" listesine `https://<alan-adin>/**` ekle.
2. **Authentication > Emails (SMTP):** Supabase'in varsayılan e-posta servisi çok düşük sınırlıdır ve proje ekibi dışındaki adreslere göndermez. Canlıda kendi SMTP'ni bağla (ör. Resend, Brevo; ücretsiz katmanları yeterlidir).
3. İsteğe bağlı: bağlantının farklı cihazda da açılması için **Authentication > Email Templates > Reset Password** şablonunda bağlantıyı şu şekilde değiştir:
   `{{ .SiteURL }}/api/admin/sifre-callback?token_hash={{ .TokenHash }}&type=recovery`

## Koruma önlemleri

- **Hız sınırı:** Müşteri başına 10 dakikada 20, günde 120 bot mesajı; web sohbetinde IP başına 10 dakikada 30; salon başına günde 1500 (`BOT_SALON_GUNLUK_SINIR` ile değişir). Sınır aşılınca müşteriye kısa bir uyarı gider ve model çağrılmaz. Salon girişinde 15 dakikada 5 hatalı denemeden sonra kilitlenir.
- **Tekrar kontrolü:** Meta aynı mesajı tekrar gönderirse ikinci kez işlenmez. Cevap arka planda üretildiği için Meta zamanında 200 alır.
- **Müşteri cevapsız kalmaz:** Model ya da WhatsApp hatasında müşteriye "şu an yanıt veremiyorum" mesajı gider, yöneticiye uyarı düşer.

## Önemli davranışlar

- **Saatler:** Tüm takvim hesapları `Europe/Istanbul` saatine göre yapılır; sunucunun saat dilimi önemli değildir.
- **Durumlar:** Bitiş saati geçen randevular otomatik "tamamlandı" olur. Admin isterse "Gelmedi" olarak işaretleyebilir.
- **Güvenlik:** Admin API'leri her istekte Supabase oturumunu doğrular. WhatsApp webhook'u imza doğrulamasından geçmeyen istekleri reddeder. Bot, müşteri numarasını modelden değil sunucudan alır.

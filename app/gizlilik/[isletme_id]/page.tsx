export const instant = false;

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = { title: "Kişisel Verilerin Korunması Aydınlatma Metni" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function Bolum({ baslik, children }: { baslik: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold">{baslik}</h2>
      <div className="text-soluk text-sm leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

export default async function GizlilikSayfasi({ params }: { params: Promise<{ isletme_id: string }> }) {
  const { isletme_id } = await params;
  if (!UUID.test(isletme_id)) notFound();

  const db = await createServerClient();
  const { data: isletme } = await db
    .from("isletme")
    .select("ad, telefon, adres")
    .eq("id", isletme_id)
    .maybeSingle();
  if (!isletme) notFound();

  return (
    <div className="isima min-h-screen px-4 py-10 sm:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Logo />
        </div>

        <h1 className="text-3xl font-bold tracking-tight">Kişisel Verilerin Korunması Aydınlatma Metni</h1>
        <p className="text-soluk text-sm mt-2 mb-8">
          6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) m.10 kapsamında hazırlanmıştır.
        </p>

        <div className="kart p-6 sm:p-8 space-y-7">
          <Bolum baslik="1. Veri sorumlusu">
            <p>
              Kişisel verileriniz, randevu hizmeti verdiği için <strong className="text-metin">{isletme.ad}</strong> tarafından
              (&quot;Salon&quot;) veri sorumlusu sıfatıyla işlenir.
            </p>
            {(isletme.adres || isletme.telefon) && (
              <p>
                {isletme.adres && <>Adres: {isletme.adres}<br /></>}
                {isletme.telefon && <>Telefon: {isletme.telefon}</>}
              </p>
            )}
            <p>
              Randevu asistanı yazılımı ve barındırma hizmeti Duble Studio tarafından, Salon adına ve Salon&apos;un
              talimatlarıyla (veri işleyen olarak) sağlanır.
            </p>
          </Bolum>

          <Bolum baslik="2. İşlenen kişisel veriler">
            <ul className="list-disc pl-5 space-y-1">
              <li>Kimlik: adınız ve soyadınız</li>
              <li>İletişim: WhatsApp telefon numaranız (ya da WhatsApp&apos;ın verdiği kullanıcı kimliği)</li>
              <li>Müşteri işlemi: aldığınız hizmet, randevu tarihi ve saati, varsa notunuz, randevu durumu (tamamlandı, iptal vb.)</li>
              <li>İşlem güvenliği: asistanla yaptığınız yazışmaların içeriği</li>
            </ul>
          </Bolum>

          <Bolum baslik="3. İşleme amaçları">
            <p>
              Randevunuzun oluşturulması, değiştirilmesi ve iptal edilmesi; randevu hatırlatması gönderilmesi; sorularınızın
              yanıtlanması ve hizmetin yürütülmesi. Mesajlarınız yapay zekâ destekli otomatik bir asistan tarafından yanıtlanır.
            </p>
          </Bolum>

          <Bolum baslik="4. Hukuki sebep">
            <p>
              Verileriniz KVKK m.5/2-c (bir sözleşmenin kurulması veya ifasıyla doğrudan ilgili olması) ve m.5/2-f
              (veri sorumlusunun meşru menfaatleri için zorunlu olması) hukuki sebeplerine dayanılarak işlenir.
            </p>
          </Bolum>

          <Bolum baslik="5. Verilerin aktarıldığı taraflar">
            <p>Hizmetin sunulabilmesi için verileriniz aşağıdaki hizmet sağlayıcılarla paylaşılır; bunların bir kısmı yurt dışındadır ve aktarım KVKK m.9 çerçevesinde yapılır:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>WhatsApp (Meta Platforms): mesajlaşma altyapısı</li>
              <li>Supabase: veritabanı (Avrupa, İrlanda)</li>
              <li>Vercel: uygulama barındırma</li>
              <li>Yapay zekâ dil modeli sağlayıcısı (Groq veya Anthropic): mesajlarınızın anlaşılması ve yanıtlanması</li>
            </ul>
            <p>Verileriniz yukarıdaki amaçlar dışında üçüncü kişilere satılmaz veya pazarlama amacıyla paylaşılmaz.</p>
          </Bolum>

          <Bolum baslik="6. Saklama süresi">
            <p>
              Randevu kayıtları, Salon ile hizmet ilişkiniz ve yasal yükümlülükler süresince saklanır; talebiniz halinde
              silinir ya da kimliğinizi ortaya çıkarmayacak şekilde anonimleştirilir. Asistanla yaptığınız yazışmalar
              en fazla 30 gün saklanır.
            </p>
          </Bolum>

          <Bolum baslik="7. Haklarınız">
            <p>KVKK m.11 uyarınca Salon&apos;a başvurarak şunları talep edebilirsiniz:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme ve işlenmişse bilgi talep etme</li>
              <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
              <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme</li>
              <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
              <li>KVKK m.7 çerçevesinde silinmesini veya yok edilmesini isteme</li>
              <li>İşlemlerin aktarıldığı üçüncü kişilere bildirilmesini isteme</li>
              <li>Otomatik sistemlerle analiz edilmesi sonucu aleyhinize bir sonuç çıkmasına itiraz etme</li>
              <li>Kanuna aykırı işleme nedeniyle zarara uğramanız halinde zararın giderilmesini talep etme</li>
            </ul>
          </Bolum>

          <Bolum baslik="8. Başvuru">
            <p>
              Taleplerinizi {isletme.telefon ? `${isletme.telefon} numaralı telefondan ya da ` : ""}Salon&apos;a şahsen
              iletebilirsiniz. Başvurunuz en geç 30 gün içinde sonuçlandırılır.
            </p>
          </Bolum>
        </div>
      </div>
    </div>
  );
}

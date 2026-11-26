"use client";

import { useEffect, useState } from "react";
import SayfaBasligi from "@/components/SayfaBasligi";
import IkonSecici from "@/components/IkonSecici";
import LogoYukle from "@/components/LogoYukle";
import { ikonAnahtari } from "@/lib/isletme-ikon";
import { PROAKTIF_MESAJLAR_ACIK } from "@/lib/proaktif";

interface Isletme {
  id?: string;
  ad: string;
  telefon: string;
  adres: string;
  ikon: string;
  whatsapp_no: string;
  logo_url: string | null;
  bildirim_eposta_acik: boolean;
  bildirim_whatsapp: string;
  bildirim_whatsapp_acik: boolean;
  ozet_eposta_acik: boolean;
}

function Anahtar({ acik, onDegisti, etiket }: { acik: boolean; onDegisti: (v: boolean) => void; etiket: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={acik}
      aria-label={etiket}
      onClick={() => onDegisti(!acik)}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${acik ? "bg-turuncu" : "bg-yuzey-3"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${acik ? "translate-x-5" : ""}`} />
    </button>
  );
}

export default function IsletmePage() {
  const [form, setForm] = useState<Isletme>({
    ad: "", telefon: "", adres: "", ikon: "makas", whatsapp_no: "", logo_url: null,
    bildirim_eposta_acik: true, bildirim_whatsapp: "", bildirim_whatsapp_acik: false, ozet_eposta_acik: true,
  });
  // Bildirim kolonları yoksa (migration 009 çalıştırılmadıysa) bölüm gizlenir ve gönderilmez.
  const [bildirimHazir, setBildirimHazir] = useState(true);
  const [ozetHazir, setOzetHazir] = useState(true);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState("");
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [mesaj, setMesaj] = useState<{ tur: "basari" | "hata"; metin: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/isletme")
      .then((r) => r.json())
      .then((d) => {
        if (d.hata) { setHata(d.hata); setYukleniyor(false); return; }
        setForm({
          id: d.id,
          ad: d.ad ?? "",
          telefon: d.telefon ?? "",
          adres: d.adres ?? "",
          ikon: ikonAnahtari(d.ikon),
          whatsapp_no: d.whatsapp_no ?? "",
          logo_url: d.logo_url ?? null,
          bildirim_eposta_acik: d.bildirim_eposta_acik !== false,
          bildirim_whatsapp: d.bildirim_whatsapp ?? "",
          bildirim_whatsapp_acik: d.bildirim_whatsapp_acik === true,
          ozet_eposta_acik: d.ozet_eposta_acik !== false,
        });
        setOzetHazir("ozet_eposta_acik" in d);
        setBildirimHazir("bildirim_eposta_acik" in d);
        setYukleniyor(false);
      })
      .catch(() => { setHata("Veriler yüklenemedi."); setYukleniyor(false); });
  }, []);

  async function kaydet(e: React.FormEvent) {
    e.preventDefault();
    setKaydediliyor(true);
    const r = await fetch("/api/admin/isletme", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        (() => {
          const { id: _id, bildirim_eposta_acik, bildirim_whatsapp, bildirim_whatsapp_acik, ozet_eposta_acik, ...temel } = form;
          return {
            ...temel,
            ...(bildirimHazir ? { bildirim_eposta_acik, bildirim_whatsapp, bildirim_whatsapp_acik } : {}),
            ...(ozetHazir ? { ozet_eposta_acik } : {}),
          };
        })()
      ),
    });
    const json = await r.json().catch(() => ({}));
    setKaydediliyor(false);
    setMesaj(r.ok ? { tur: "basari", metin: "Kaydedildi." } : { tur: "hata", metin: json.hata ?? "Hata oluştu." });
    setTimeout(() => setMesaj(null), 4000);
  }

  if (yukleniyor) return <p className="text-soluk text-sm">Yükleniyor...</p>;
  if (hata) return <p className="uyari-kutusu uyari-hata">{hata}</p>;

  return (
    <div>
      <SayfaBasligi baslik="İşletme" vurgu="bilgileri" aciklama="Salonunun genel bilgilerini ve WhatsApp numarasını düzenle" />

      <form onSubmit={kaydet} className="space-y-5">
        <div className="kart p-6 space-y-6">
          <div>
            <p className="etiket">Salon Logosu</p>
            <LogoYukle
              ad={form.ad || "Salon"}
              ikon={form.ikon}
              logoUrl={form.logo_url}
              onDegisti={(url) => setForm((f) => ({ ...f, logo_url: url }))}
            />
            <p className="text-xs text-silik mt-3">
              Logo hemen kaydedilir ve menüde ile müşteri sohbetinde görünür.
            </p>
          </div>

          <div className="border-t border-cizgi pt-6">
            <p className="etiket">Simge</p>
            <p className="text-xs text-silik mb-4">
              Logo yüklemediysen bu simge kullanılır. Değişiklik, aşağıdaki <span className="text-metin font-semibold">Kaydet</span> düğmesiyle uygulanır.
            </p>
            <IkonSecici deger={form.ikon} onDegisti={(ikon) => setForm({ ...form, ikon })} />
          </div>
        </div>

        <div className="kart p-6 space-y-5">
          <div>
            <label className="etiket" htmlFor="ad">Salon Adı</label>
            <input
              id="ad"
              className="girdi"
              value={form.ad}
              onChange={(e) => setForm({ ...form, ad: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="etiket" htmlFor="tel">Telefon</label>
              <input
                id="tel"
                className="girdi"
                value={form.telefon}
                onChange={(e) => setForm({ ...form, telefon: e.target.value })}
              />
            </div>
            <div>
              <label className="etiket" htmlFor="wa">WhatsApp Bot Numarası</label>
              <input
                id="wa"
                className="girdi"
                placeholder="+905551234567"
                value={form.whatsapp_no}
                onChange={(e) => setForm({ ...form, whatsapp_no: e.target.value })}
              />
            </div>
          </div>
          <p className="text-xs text-silik -mt-2">
            Müşterilerin mesaj attığı numara. Gelen mesajlar bu numaraya göre salonuna yönlendirilir.
          </p>

          <div>
            <label className="etiket" htmlFor="adres">Adres</label>
            <textarea
              id="adres"
              className="girdi resize-none"
              rows={2}
              value={form.adres}
              onChange={(e) => setForm({ ...form, adres: e.target.value })}
            />
          </div>

          {bildirimHazir && (
            <div className="border-t border-cizgi pt-6 space-y-5">
              <div>
                <p className="etiket">Yeni randevu bildirimi</p>
                <p className="text-xs text-silik">
                  Müşteri randevu aldığında, iptal ettiğinde ya da değiştirdiğinde sana haber verilir.
                </p>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-sm">E-posta ile bildir</p>
                  <p className="text-xs text-silik">Giriş yaptığın e-posta adresine gönderilir.</p>
                </div>
                <Anahtar
                  acik={form.bildirim_eposta_acik}
                  onDegisti={(v) => setForm({ ...form, bildirim_eposta_acik: v })}
                  etiket="E-posta ile bildir"
                />
              </div>

              {PROAKTIF_MESAJLAR_ACIK && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-sm">WhatsApp ile bildir</p>
                    <p className="text-xs text-silik">Telefonuna WhatsApp mesajı düşer.</p>
                  </div>
                  <Anahtar
                    acik={form.bildirim_whatsapp_acik}
                    onDegisti={(v) => setForm({ ...form, bildirim_whatsapp_acik: v })}
                    etiket="WhatsApp ile bildir"
                  />
                </div>
                <div>
                  <label className="etiket" htmlFor="bildirim-wa">Bildirimin geleceği kişisel numaran</label>
                  <input
                    id="bildirim-wa"
                    className="girdi"
                    placeholder="+905551234567"
                    value={form.bildirim_whatsapp}
                    onChange={(e) => setForm({ ...form, bildirim_whatsapp: e.target.value })}
                  />
                  <p className="text-xs text-silik mt-1.5">
                    Müşterilerin yazdığı bot numarasından farklı, kendi numaran olmalı.
                  </p>
                </div>
              </div>
              )}
            </div>
          )}

          {ozetHazir && (
            <div className="border-t border-cizgi pt-6 flex items-center justify-between gap-4">
              <div>
                <p className="etiket">Haftalık özet e-postası</p>
                <p className="text-xs text-silik">
                  Her Pazartesi sabahı geçen haftanın randevu sayısı, cirosu ve önümüzdeki haftanın durumu giriş e-postana gelir.
                </p>
              </div>
              <Anahtar
                acik={form.ozet_eposta_acik}
                onDegisti={(v) => setForm({ ...form, ozet_eposta_acik: v })}
                etiket="Haftalık özet e-postası"
              />
            </div>
          )}

          {form.id && (
            <div className="border-t border-cizgi pt-5">
              <p className="etiket">Müşteri aydınlatma metni (KVKK)</p>
              <p className="text-xs text-silik mb-2">
                Müşterilerin kişisel verilerinin nasıl işlendiğini anlatan sayfa. Bot, yeni müşteriye ilk mesajında bu bağlantıyı gönderir.
                İstersen Instagram ya da dükkânda da paylaşabilirsin.
              </p>
              <a
                href={`/gizlilik/${form.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-turuncu hover:underline break-all"
              >
                {typeof window !== "undefined" ? window.location.origin : ""}/gizlilik/{form.id}
              </a>
            </div>
          )}

          <div className="flex items-center gap-4 pt-1">
            <button type="submit" disabled={kaydediliyor} className="btn btn-ana">
              {kaydediliyor ? "Kaydediliyor..." : "Kaydet"}
            </button>
            {mesaj && (
              <span className={`text-sm ${mesaj.tur === "basari" ? "text-basari" : "text-hata"}`}>{mesaj.metin}</span>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

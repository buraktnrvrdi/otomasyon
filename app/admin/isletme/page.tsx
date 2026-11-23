"use client";

import { useEffect, useState } from "react";
import SayfaBasligi from "@/components/SayfaBasligi";
import IkonSecici from "@/components/IkonSecici";
import LogoYukle from "@/components/LogoYukle";
import { ikonAnahtari } from "@/lib/isletme-ikon";

interface Isletme {
  ad: string;
  telefon: string;
  adres: string;
  ikon: string;
  whatsapp_no: string;
  logo_url: string | null;
}

export default function IsletmePage() {
  const [form, setForm] = useState<Isletme>({ ad: "", telefon: "", adres: "", ikon: "makas", whatsapp_no: "", logo_url: null });
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
          ad: d.ad ?? "",
          telefon: d.telefon ?? "",
          adres: d.adres ?? "",
          ikon: ikonAnahtari(d.ikon),
          whatsapp_no: d.whatsapp_no ?? "",
          logo_url: d.logo_url ?? null,
        });
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
      body: JSON.stringify(form),
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

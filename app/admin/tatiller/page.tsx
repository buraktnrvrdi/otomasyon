"use client";

import { useEffect, useState } from "react";
import SayfaBasligi from "@/components/SayfaBasligi";
import { ArtiIkon } from "@/components/ikonlar";

interface Kayit {
  id: string;
  baslangic_tarih: string;
  bitis_tarih: string;
  baslangic_saat: string | null;
  bitis_saat: string | null;
  aciklama: string | null;
}

/** "2026-12-25" -> "25.12.2026" */
const tarihMetni = (t: string) => t.split("-").reverse().join(".");

const BOS = { baslangic_tarih: "", bitis_tarih: "", tum_gun: true, baslangic_saat: "12:00", bitis_saat: "13:00", aciklama: "" };

export default function TatillerPage() {
  const [kayitlar, setKayitlar] = useState<Kayit[]>([]);
  const [hazir, setHazir] = useState(true);
  const [yuklendi, setYuklendi] = useState(false);
  const [form, setForm] = useState(BOS);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [mesaj, setMesaj] = useState<{ tur: "basari" | "hata" | "uyari"; metin: string } | null>(null);

  async function yukle() {
    const r = await fetch("/api/admin/tatiller", { cache: "no-store" });
    const d = await r.json().catch(() => ({}));
    if (Array.isArray(d.kayitlar)) setKayitlar(d.kayitlar);
    setHazir(d.hazir !== false);
    setYuklendi(true);
  }

  useEffect(() => { yukle(); }, []);

  async function ekle(e: React.FormEvent) {
    e.preventDefault();
    setKaydediliyor(true);
    setMesaj(null);
    const r = await fetch("/api/admin/tatiller", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, bitis_tarih: form.bitis_tarih || form.baslangic_tarih }),
    });
    const d = await r.json().catch(() => ({}));
    setKaydediliyor(false);

    if (!r.ok) {
      setMesaj({ tur: "hata", metin: d.hata ?? "Kaydedilemedi." });
      return;
    }
    setForm(BOS);
    setMesaj(
      d.etkilenen_randevu > 0
        ? {
            tur: "uyari",
            metin: `Kaydedildi. Bu aralıkta daha önce alınmış ${d.etkilenen_randevu} randevu var; bunlar otomatik iptal edilmez. Randevular sayfasından müşterilerle konuşup iptal et ya da taşı.`,
          }
        : { tur: "basari", metin: "Kaydedildi. Bot bu tarihlerde randevu vermeyecek." }
    );
    yukle();
  }

  async function sil(id: string) {
    if (!confirm("Bu kaydı silmek istediğine emin misin? Bot bu tarihlerde yeniden randevu verebilir.")) return;
    await fetch("/api/admin/tatiller", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    yukle();
  }

  return (
    <div>
      <SayfaBasligi
        baslik="Tatil"
        vurgu="günleri"
        aciklama="Bu tarihlerde bot randevu vermez ve müşteriye salonun kapalı olduğunu söyler"
      />

      {!hazir && (
        <p className="uyari-kutusu mb-6">
          Tatil tablosu henüz oluşturulmamış. Yöneticiden <code>010_kapali_gunler.sql</code> dosyasını çalıştırmasını iste.
        </p>
      )}

      <form onSubmit={ekle} className="kart p-6 space-y-5 mb-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="etiket" htmlFor="bas">Başlangıç tarihi</label>
            <input id="bas" type="date" className="girdi" value={form.baslangic_tarih} required
              onChange={(e) => setForm({ ...form, baslangic_tarih: e.target.value, bitis_tarih: form.bitis_tarih || e.target.value })} />
          </div>
          <div>
            <label className="etiket" htmlFor="bit">Bitiş tarihi</label>
            <input id="bit" type="date" className="girdi" value={form.bitis_tarih} min={form.baslangic_tarih}
              onChange={(e) => setForm({ ...form, bitis_tarih: e.target.value })} />
          </div>
        </div>
        <p className="text-xs text-silik -mt-2">Tek bir gün için bitiş tarihini boş bırak ya da aynı günü seç.</p>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-sm">Tüm gün kapalı</p>
            <p className="text-xs text-silik">Kapatırsan sadece belirli saatler (öğle arası gibi) kapanır.</p>
          </div>
          <button type="button" role="switch" aria-checked={form.tum_gun} aria-label="Tüm gün kapalı"
            onClick={() => setForm({ ...form, tum_gun: !form.tum_gun })}
            className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${form.tum_gun ? "bg-turuncu" : "bg-yuzey-3"}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.tum_gun ? "translate-x-5" : ""}`} />
          </button>
        </div>

        {!form.tum_gun && (
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="etiket" htmlFor="bs">Kapalı başlangıç saati</label>
              <input id="bs" type="time" className="girdi" value={form.baslangic_saat}
                onChange={(e) => setForm({ ...form, baslangic_saat: e.target.value })} required />
            </div>
            <div>
              <label className="etiket" htmlFor="bts">Kapalı bitiş saati</label>
              <input id="bts" type="time" className="girdi" value={form.bitis_saat}
                onChange={(e) => setForm({ ...form, bitis_saat: e.target.value })} required />
            </div>
          </div>
        )}

        <div>
          <label className="etiket" htmlFor="ac">Açıklama (isteğe bağlı)</label>
          <input id="ac" className="girdi" maxLength={120} placeholder="Bayram tatili, yıllık izin, öğle arası..."
            value={form.aciklama} onChange={(e) => setForm({ ...form, aciklama: e.target.value })} />
          <p className="text-xs text-silik mt-1.5">Bot bunu müşteriye söyleyebilir.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" disabled={kaydediliyor || !hazir} className="btn btn-ana">
            <ArtiIkon className="w-4 h-4" />
            {kaydediliyor ? "Kaydediliyor..." : "Ekle"}
          </button>
        </div>
        {mesaj && (
          <p className={`text-sm ${mesaj.tur === "basari" ? "text-basari" : mesaj.tur === "uyari" ? "uyari-kutusu" : "text-hata"}`}>
            {mesaj.metin}
          </p>
        )}
      </form>

      <p className="etiket mb-3">Yaklaşan tatiller ve izinler</p>
      {!yuklendi ? (
        <p className="text-soluk text-sm">Yükleniyor...</p>
      ) : kayitlar.length === 0 ? (
        <div className="kart p-6 text-soluk text-sm">Planlanmış tatil yok.</div>
      ) : (
        <ul className="space-y-2.5">
          {kayitlar.map((k) => (
            <li key={k.id} className="kart px-5 py-4 flex flex-wrap items-center gap-x-5 gap-y-2">
              <div className="flex-1 min-w-[12rem]">
                <p className="font-semibold">
                  {k.baslangic_tarih === k.bitis_tarih
                    ? tarihMetni(k.baslangic_tarih)
                    : `${tarihMetni(k.baslangic_tarih)} – ${tarihMetni(k.bitis_tarih)}`}
                </p>
                <p className="text-sm text-soluk">
                  {k.baslangic_saat ? `Her gün ${k.baslangic_saat}–${k.bitis_saat} arası kapalı` : "Tüm gün kapalı"}
                  {k.aciklama ? ` · ${k.aciklama}` : ""}
                </p>
              </div>
              <button onClick={() => sil(k.id)} className="btn btn-tehlike btn-kucuk">Sil</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

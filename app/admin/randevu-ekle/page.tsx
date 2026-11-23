"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SayfaBasligi from "@/components/SayfaBasligi";

interface Hizmet {
  id: string;
  ad: string;
  sure_dakika: number;
  fiyat: number;
}

export default function RandevuEklePage() {
  const router = useRouter();
  const [hizmetler, setHizmetler] = useState<Hizmet[]>([]);
  const [form, setForm] = useState({
    musteri_ad: "",
    musteri_whatsapp: "",
    hizmet_id: "",
    tarih: "",
    saat: "",
  });
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState("");
  const [hizmetYok, setHizmetYok] = useState(false);
  const [basari, setBasari] = useState(false);

  useEffect(() => {
    fetch("/api/admin/hizmetler")
      .then((r) => r.json())
      .then((data) => {
        const aktif = Array.isArray(data) ? data.filter((h) => h.aktif !== false) : [];
        setHizmetler(aktif);
        if (aktif.length > 0) setForm((f) => ({ ...f, hizmet_id: aktif[0].id }));
        else setHizmetYok(true);
      })
      .catch(() => setHizmetYok(true));
  }, []);

  async function kaydet(e: React.FormEvent) {
    e.preventDefault();
    setYukleniyor(true);
    setHata("");
    setBasari(false);

    const res = await fetch("/api/randevular", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setYukleniyor(false);

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setHata(json.error || "Bir hata oluştu.");
      return;
    }

    setBasari(true);
    setForm({ musteri_ad: "", musteri_whatsapp: "", hizmet_id: hizmetler[0]?.id ?? "", tarih: "", saat: "" });
    setTimeout(() => router.push("/dashboard"), 1500);
  }

  const secili = hizmetler.find((h) => h.id === form.hizmet_id);

  return (
    <div>
      <SayfaBasligi baslik="Yeni" vurgu="randevu" aciklama="Telefonla ya da yüz yüze alınan randevuları buradan ekle" />

      <form onSubmit={kaydet} className="kart p-6 space-y-5 max-w-2xl">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="etiket" htmlFor="ad">Müşteri Adı</label>
            <input
              id="ad"
              required
              className="girdi"
              placeholder="Ad Soyad"
              value={form.musteri_ad}
              onChange={(e) => setForm({ ...form, musteri_ad: e.target.value })}
            />
          </div>
          <div>
            <label className="etiket" htmlFor="tel">WhatsApp Numarası</label>
            <input
              id="tel"
              required
              inputMode="tel"
              className="girdi"
              placeholder="0555 123 45 67"
              value={form.musteri_whatsapp}
              onChange={(e) => setForm({ ...form, musteri_whatsapp: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="etiket" htmlFor="hizmet">Hizmet</label>
          {hizmetYok ? (
            <p className="uyari-kutusu uyari-bilgi">
              Henüz aktif hizmet yok.{" "}
              <Link href="/admin/hizmetler" className="font-semibold underline">Önce hizmet ekle</Link>
            </p>
          ) : (
            <select
              id="hizmet"
              required
              className="girdi"
              value={form.hizmet_id}
              onChange={(e) => setForm({ ...form, hizmet_id: e.target.value })}
            >
              {hizmetler.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.ad} · {h.sure_dakika} dk · {h.fiyat} ₺
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="etiket" htmlFor="tarih">Tarih</label>
            <input
              id="tarih"
              type="date"
              required
              className="girdi"
              value={form.tarih}
              onChange={(e) => setForm({ ...form, tarih: e.target.value })}
            />
          </div>
          <div>
            <label className="etiket" htmlFor="saat">Saat</label>
            <input
              id="saat"
              type="time"
              required
              className="girdi"
              value={form.saat}
              onChange={(e) => setForm({ ...form, saat: e.target.value })}
            />
          </div>
        </div>

        {secili && form.saat && (
          <p className="text-sm text-soluk">
            Süre <span className="text-metin font-semibold">{secili.sure_dakika} dk</span> · Ücret{" "}
            <span className="text-metin font-semibold">{secili.fiyat} ₺</span>
          </p>
        )}

        {hata && <p className="uyari-kutusu uyari-hata">{hata}</p>}
        {basari && <p className="uyari-kutusu uyari-basari">Randevu oluşturuldu. Randevulara yönlendiriliyorsun...</p>}

        <button type="submit" disabled={yukleniyor || hizmetYok} className="btn btn-ana">
          {yukleniyor ? "Kaydediliyor..." : "Randevu Oluştur"}
        </button>
      </form>
    </div>
  );
}

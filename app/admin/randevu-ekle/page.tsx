"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
  const [hizmetHata, setHizmetHata] = useState("");
  const [basari, setBasari] = useState(false);

  useEffect(() => {
    fetch("/api/admin/hizmetler")
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) {
          setHizmetHata("Hizmetler yuklenemedi. Once Hizmetler sayfasindan hizmet ekleyin.");
          return;
        }
        const aktif = data.filter((h) => h.aktif !== false);
        setHizmetler(aktif);
        if (aktif.length > 0) setForm((f) => ({ ...f, hizmet_id: aktif[0].id }));
        else setHizmetHata("Henuz hizmet eklenmemis. Once Hizmetler sayfasindan hizmet ekleyin.");
      })
      .catch(() => setHizmetHata("Hizmetler yuklenemedi."));
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
      const json = await res.json();
      setHata(json.error || "Bir hata olustu");
      return;
    }

    setBasari(true);
    setForm({ musteri_ad: "", musteri_whatsapp: "", hizmet_id: hizmetler[0]?.id ?? "", tarih: "", saat: "" });
    setTimeout(() => router.push("/dashboard"), 1500);
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Randevu Ekle</h1>
      <p className="text-gray-400 text-sm mb-6">Manuel olarak yeni randevu olusturun</p>

      <form onSubmit={kaydet} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
            Musteri Adi
          </label>
          <input
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
            placeholder="Ad Soyad"
            value={form.musteri_ad}
            onChange={(e) => setForm({ ...form, musteri_ad: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
            WhatsApp Numarasi
          </label>
          <input
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
            placeholder="+905551234567"
            value={form.musteri_whatsapp}
            onChange={(e) => setForm({ ...form, musteri_whatsapp: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
            Hizmet
          </label>
          {hizmetHata ? (
            <p className="text-sm text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              {hizmetHata}
            </p>
          ) : (
            <select
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
              value={form.hizmet_id}
              onChange={(e) => setForm({ ...form, hizmet_id: e.target.value })}
            >
              {hizmetler.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.ad} — {h.sure_dakika} dk — {h.fiyat} TL
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
              Tarih
            </label>
            <input
              type="date"
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
              value={form.tarih}
              onChange={(e) => setForm({ ...form, tarih: e.target.value })}
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
              Saat
            </label>
            <input
              type="time"
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
              value={form.saat}
              onChange={(e) => setForm({ ...form, saat: e.target.value })}
            />
          </div>
        </div>

        {hata && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {hata}
          </p>
        )}
        {basari && (
          <p className="text-sm text-green-600 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
            Randevu olusturuldu. Yonlendiriliyor...
          </p>
        )}

        <button
          type="submit"
          disabled={yukleniyor}
          className="bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-gray-800 transition-colors"
        >
          {yukleniyor ? "Kaydediliyor..." : "Randevu Olustur"}
        </button>
      </form>
    </div>
  );
}

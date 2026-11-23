"use client";

import { useEffect, useState } from "react";

const IKONLAR = ["🏪", "✂️", "💈", "💇", "💅", "🪒", "🧴", "🌟", "⭐", "🔥", "💎", "🎯"];

interface Isletme {
  ad: string;
  telefon: string;
  adres: string;
  ikon: string;
  whatsapp_no: string;
}

export default function IsletmePage() {
  const [form, setForm] = useState<Isletme>({ ad: "", telefon: "", adres: "", ikon: "🏪", whatsapp_no: "" });
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState("");
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [mesaj, setMesaj] = useState("");

  useEffect(() => {
    fetch("/api/admin/isletme")
      .then((r) => r.json())
      .then((d) => {
        if (d.hata) { setHata(d.hata); setYukleniyor(false); return; }
        setForm({
          ad: d.ad ?? "",
          telefon: d.telefon ?? "",
          adres: d.adres ?? "",
          ikon: d.ikon ?? "🏪",
          whatsapp_no: d.whatsapp_no ?? "",
        });
        setYukleniyor(false);
      })
      .catch(() => { setHata("Veriler yuklenemedi."); setYukleniyor(false); });
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
    setMesaj(r.ok ? "Kaydedildi." : (json.hata ?? "Hata olustu."));
    setTimeout(() => setMesaj(""), 4000);
  }

  if (yukleniyor) return <p className="text-gray-400 text-sm">Yukleniyor...</p>;
  if (hata) return <p className="text-red-500 text-sm">{hata}</p>;

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Isletme Bilgileri</h1>
      <p className="text-gray-400 text-sm mb-6">Salonunuzun genel bilgilerini duzenleyin</p>

      <form onSubmit={kaydet} className="space-y-5">
        {/* Ikon secici */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
            Salon Ikonu
          </label>
          <div className="flex flex-wrap gap-2">
            {IKONLAR.map((ikon) => (
              <button
                key={ikon}
                type="button"
                onClick={() => setForm({ ...form, ikon })}
                className={`w-11 h-11 text-2xl rounded-xl border-2 transition-all flex items-center justify-center ${
                  form.ikon === ikon
                    ? "border-gray-900 bg-gray-50 scale-110"
                    : "border-gray-200 hover:border-gray-400"
                }`}
              >
                {ikon}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Secili ikon sol menude goruntulenir
          </p>
        </div>

        {/* Bilgiler */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
              Isletme Adi
            </label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
              value={form.ad}
              onChange={(e) => setForm({ ...form, ad: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
              Telefon
            </label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
              value={form.telefon}
              onChange={(e) => setForm({ ...form, telefon: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
              WhatsApp Bot Numarasi
            </label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
              placeholder="+905551234567"
              value={form.whatsapp_no}
              onChange={(e) => setForm({ ...form, whatsapp_no: e.target.value })}
            />
            <p className="text-xs text-gray-400 mt-1.5">
              Musterilerin mesaj attigi numara. Gelen mesajlar bu numaraya gore isletmenize yonlendirilir.
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
              Adres
            </label>
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all resize-none"
              rows={2}
              value={form.adres}
              onChange={(e) => setForm({ ...form, adres: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-4 pt-1">
            <button
              type="submit"
              disabled={kaydediliyor}
              className="bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-gray-800 transition-colors"
            >
              {kaydediliyor ? "Kaydediliyor..." : "Kaydet"}
            </button>
            {mesaj && (
              <span className={`text-sm ${mesaj === "Kaydedildi." ? "text-green-600" : "text-red-500"}`}>
                {mesaj}
              </span>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

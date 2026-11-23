"use client";

import { useEffect, useState } from "react";

interface Hizmet {
  id: string;
  ad: string;
  sure_dakika: number;
  fiyat: number;
  aktif: boolean;
}

const BOS: Omit<Hizmet, "id" | "aktif"> = { ad: "", sure_dakika: 30, fiyat: 0 };

export default function HizmetlerPage() {
  const [hizmetler, setHizmetler] = useState<Hizmet[]>([]);
  const [yeni, setYeni] = useState(BOS);
  const [ekleniyor, setEkleniyor] = useState(false);
  const [siliniyor, setSiliniyor] = useState<string | null>(null);

  async function yukle() {
    const r = await fetch("/api/admin/hizmetler");
    const data = await r.json();
    if (Array.isArray(data)) setHizmetler(data);
  }

  useEffect(() => { yukle(); }, []);

  async function ekle(e: React.FormEvent) {
    e.preventDefault();
    setEkleniyor(true);
    await fetch("/api/admin/hizmetler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(yeni),
    });
    setYeni(BOS);
    setEkleniyor(false);
    yukle();
  }

  async function aktifToggle(h: Hizmet) {
    await fetch("/api/admin/hizmetler", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: h.id, aktif: !h.aktif }),
    });
    yukle();
  }

  async function sil(id: string) {
    if (!confirm("Bu hizmeti silmek istediginize emin misiniz?")) return;
    setSiliniyor(id);
    await fetch("/api/admin/hizmetler", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setSiliniyor(null);
    yukle();
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Hizmetler</h1>
      <p className="text-gray-400 text-sm mb-6">Salon hizmetlerinizi ve fiyatlarini yonetin</p>

      {/* Mevcut hizmetler */}
      <div className="bg-white rounded-xl border border-gray-200 mb-6 overflow-hidden">
        {hizmetler.length === 0 ? (
          <p className="text-gray-400 text-sm p-6">Henuz hizmet eklenmedi.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Hizmet</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Sure</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Fiyat</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Durum</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {hizmetler.map((h) => (
                <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-gray-900">{h.ad}</td>
                  <td className="px-5 py-3.5 text-gray-500">{h.sure_dakika} dk</td>
                  <td className="px-5 py-3.5 text-gray-500">{h.fiyat} TL</td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => aktifToggle(h)}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                        h.aktif
                          ? "bg-green-50 text-green-700 hover:bg-green-100"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {h.aktif ? "Aktif" : "Pasif"}
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => sil(h.id)}
                      disabled={siliniyor === h.id}
                      className="text-xs text-gray-400 hover:text-red-500 disabled:opacity-40 transition-colors"
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Yeni hizmet */}
      <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Yeni Hizmet</h2>
      <form onSubmit={ekle} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Hizmet Adi</label>
          <input
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
            placeholder="Sac Kesimi"
            value={yeni.ad}
            onChange={(e) => setYeni({ ...yeni, ad: e.target.value })}
            required
          />
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Sure (dk)</label>
            <input
              type="number"
              min={5}
              step={5}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
              value={yeni.sure_dakika}
              onChange={(e) => setYeni({ ...yeni, sure_dakika: Number(e.target.value) })}
              required
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Fiyat (TL)</label>
            <input
              type="number"
              min={0}
              step={10}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
              value={yeni.fiyat}
              onChange={(e) => setYeni({ ...yeni, fiyat: Number(e.target.value) })}
              required
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={ekleniyor}
          className="bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-gray-800 transition-colors"
        >
          {ekleniyor ? "Ekleniyor..." : "Ekle"}
        </button>
      </form>
    </div>
  );
}

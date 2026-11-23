"use client";

import { useEffect, useState } from "react";

const GUNLER = ["Pazar", "Pazartesi", "Sali", "Carsamba", "Persembe", "Cuma", "Cumartesi"];

interface Saat {
  id: string;
  gun: number;
  acilis: string;
  kapanis: string;
  kapali: boolean;
}

export default function SaatlerPage() {
  const [saatler, setSaatler] = useState<Saat[]>([]);
  const [kaydedilen, setKaydedilen] = useState<string | null>(null);

  async function yukle() {
    const r = await fetch("/api/admin/saatler");
    setSaatler(await r.json());
  }

  useEffect(() => { yukle(); }, []);

  async function guncelle(saat: Saat) {
    await fetch("/api/admin/saatler", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(saat),
    });
    setKaydedilen(saat.id);
    setTimeout(() => setKaydedilen(null), 2000);
  }

  function set(id: string, alan: keyof Saat, deger: string | boolean) {
    setSaatler((prev) => prev.map((s) => (s.id === id ? { ...s, [alan]: deger } : s)));
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Calisma Saatleri</h1>
      <p className="text-gray-400 text-sm mb-6">Gunluk acilis ve kapanis saatlerini ayarlayin</p>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3 w-32">Gun</th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Durum</th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Saatler</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {saatler.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5 font-medium text-gray-900">{GUNLER[s.gun]}</td>
                <td className="px-5 py-3.5">
                  <button
                    onClick={() => {
                      const guncellenmis = { ...s, kapali: !s.kapali };
                      set(s.id, "kapali", !s.kapali);
                      guncelle(guncellenmis);
                    }}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                      s.kapali
                        ? "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        : "bg-green-50 text-green-700 hover:bg-green-100"
                    }`}
                  >
                    {s.kapali ? "Kapali" : "Acik"}
                  </button>
                </td>
                <td className="px-5 py-3.5">
                  {s.kapali ? (
                    <span className="text-gray-300">—</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                        value={s.acilis}
                        onChange={(e) => set(s.id, "acilis", e.target.value)}
                      />
                      <span className="text-gray-300">—</span>
                      <input
                        type="time"
                        className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                        value={s.kapanis}
                        onChange={(e) => set(s.id, "kapanis", e.target.value)}
                      />
                    </div>
                  )}
                </td>
                <td className="px-5 py-3.5 text-right">
                  {!s.kapali && (
                    <button
                      onClick={() => guncelle(s)}
                      className="text-xs text-gray-400 hover:text-gray-900 transition-colors font-medium"
                    >
                      {kaydedilen === s.id ? "Kaydedildi" : "Kaydet"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

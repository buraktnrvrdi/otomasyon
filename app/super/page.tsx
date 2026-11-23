"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { tarihSaatMetni } from "@/lib/utils/zaman";

interface DavetKodu {
  id: string;
  kod: string;
  kullanildi: boolean;
  olusturuldu_at: string;
}

export default function SuperPage() {
  const router = useRouter();
  const [kodlar, setKodlar] = useState<DavetKodu[]>([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [yeniKod, setYeniKod] = useState<string | null>(null);
  const [hata, setHata] = useState("");

  async function yukle() {
    const r = await fetch("/api/super/kodlar", { cache: "no-store" });
    if (r.status === 401) { router.replace("/super/login"); return; }
    if (!r.ok) return;
    setKodlar(await r.json());
  }

  useEffect(() => { yukle(); }, []);

  async function kodUret() {
    setYukleniyor(true);
    setYeniKod(null);
    setHata("");
    const r = await fetch("/api/super/kod-uret", { method: "POST", cache: "no-store" });
    const data = await r.json().catch(() => ({}));
    setYukleniyor(false);
    if (r.status === 401) { router.replace("/super/login"); return; }
    if (!r.ok) { setHata(data.hata ?? "Kod olusturulamadi."); return; }
    if (data.kod) {
      setYeniKod(data.kod);
      yukle();
    }
  }

  async function cikis() {
    await fetch("/api/super/logout", { method: "POST" });
    router.push("/super/login");
  }

  return (
    <div className="min-h-screen bg-[#0f1117] text-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold">Super Admin</h1>
            <p className="text-white/40 text-sm mt-0.5">Davet kodu yonetimi</p>
          </div>
          <button
            onClick={cikis}
            className="text-xs text-white/40 hover:text-red-400 transition-colors"
          >
            Cikis Yap
          </button>
        </div>

        <button
          onClick={kodUret}
          disabled={yukleniyor}
          className="mb-6 bg-white text-[#0f1117] px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-40 hover:bg-white/90 transition-colors"
        >
          {yukleniyor ? "Olusturuluyor..." : "Yeni Kod Uret"}
        </button>

        {hata && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl px-5 py-3">
            <p className="text-red-400 text-sm">{hata}</p>
          </div>
        )}

        {yeniKod && (
          <div className="mb-6 bg-green-500/10 border border-green-500/30 rounded-xl px-5 py-4">
            <p className="text-xs text-green-400 mb-1">Yeni kod olusturuldu</p>
            <p className="text-2xl font-mono font-bold tracking-widest text-green-300">{yeniKod}</p>
            <p className="text-xs text-white/40 mt-1">Bu kodu musteri ile paylasin</p>
          </div>
        )}

        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          {kodlar.length === 0 ? (
            <p className="text-white/40 text-sm p-6">Henuz kod olusturulmadi.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-xs font-medium text-white/40 uppercase tracking-wider px-5 py-3">Kod</th>
                  <th className="text-left text-xs font-medium text-white/40 uppercase tracking-wider px-5 py-3">Durum</th>
                  <th className="text-left text-xs font-medium text-white/40 uppercase tracking-wider px-5 py-3">Tarih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {kodlar.map((k) => (
                  <tr key={k.id}>
                    <td className="px-5 py-3.5 font-mono font-bold tracking-widest text-white">
                      {k.kod}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        k.kullanildi
                          ? "bg-white/10 text-white/40"
                          : "bg-green-500/15 text-green-400"
                      }`}>
                        {k.kullanildi ? "Kullanildi" : "Aktif"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-white/40 text-xs font-mono">
                      {tarihSaatMetni(new Date(k.olusturuldu_at))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

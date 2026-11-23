"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface Hizmet {
  id: string;
  ad: string;
  sure_dakika: number;
}

interface Props {
  id: string;
  hizmetId: string | null;
  baslangic: string;
}

export default function RandevuEylemleri({ id, hizmetId, baslangic }: Props) {
  const router = useRouter();
  const [yukleniyor, setYukleniyor] = useState(false);
  const [modalAcik, setModalAcik] = useState(false);
  const [hizmetler, setHizmetler] = useState<Hizmet[]>([]);
  const [seciliHizmetId, setSeciliHizmetId] = useState(hizmetId ?? "");
  const [tarih, setTarih] = useState(baslangic.slice(0, 10));
  const [saat, setSaat] = useState(baslangic.slice(11, 16));
  const [hata, setHata] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);

  async function iptalEt() {
    if (!confirm("Bu randevuyu iptal etmek istediginize emin misiniz?")) return;
    setYukleniyor(true);
    setHata("");
    const res = await fetch(`/api/randevular/${id}`, { method: "PATCH" });
    setYukleniyor(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setHata(json.error ?? "Bir hata olustu.");
      return;
    }
    router.refresh();
  }

  async function duzenleAc() {
    if (hizmetler.length === 0) {
      const res = await fetch("/api/admin/hizmetler");
      const data = await res.json();
      setHizmetler(data);
    }
    setSeciliHizmetId(hizmetId ?? "");
    setTarih(baslangic.slice(0, 10));
    setSaat(baslangic.slice(11, 16));
    setHata("");
    setModalAcik(true);
  }

  async function kaydet() {
    const hizmet = hizmetler.find((h) => h.id === seciliHizmetId);
    if (!hizmet) { setHata("Hizmet secin."); return; }
    const bas = new Date(`${tarih}T${saat}:00`);
    const bit = new Date(bas.getTime() + hizmet.sure_dakika * 60000);
    setYukleniyor(true);
    setHata("");
    const res = await fetch(`/api/randevular/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hizmet_id: seciliHizmetId,
        baslangic: bas.toISOString(),
        bitis: bit.toISOString(),
      }),
    });
    setYukleniyor(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setHata(json.error ?? "Bir hata olustu.");
      return;
    }
    setModalAcik(false);
    router.refresh();
  }

  useEffect(() => {
    function kapat(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setModalAcik(false);
      }
    }
    if (modalAcik) document.addEventListener("mousedown", kapat);
    return () => document.removeEventListener("mousedown", kapat);
  }, [modalAcik]);

  return (
    <>
      <div className="flex gap-1.5">
        <button
          onClick={duzenleAc}
          className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
        >
          Duzenle
        </button>
        <button
          onClick={iptalEt}
          disabled={yukleniyor}
          className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-40 transition-colors"
        >
          {yukleniyor ? "..." : "Iptal"}
        </button>
      </div>

      {hata && !modalAcik && (
        <p className="text-xs text-red-500 mt-1">{hata}</p>
      )}

      {modalAcik && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div
            ref={modalRef}
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4"
          >
            <h2 className="text-base font-semibold text-gray-900 mb-4">Randevu Duzenle</h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Hizmet</label>
                <select
                  value={seciliHizmetId}
                  onChange={(e) => setSeciliHizmetId(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  <option value="">Secin...</option>
                  {hizmetler.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.ad} ({h.sure_dakika} dk)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Tarih</label>
                <input
                  type="date"
                  value={tarih}
                  onChange={(e) => setTarih(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Saat</label>
                <input
                  type="time"
                  value={saat}
                  onChange={(e) => setSaat(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              {hata && <p className="text-xs text-red-500">{hata}</p>}
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setModalAcik(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Vazgec
              </button>
              <button
                onClick={kaydet}
                disabled={yukleniyor}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 disabled:opacity-40 transition-colors"
              >
                {yukleniyor ? "..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

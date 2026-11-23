"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { yerelSaat, yerelTarih } from "@/lib/utils/zaman";

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
  const [tarih, setTarih] = useState(() => yerelTarih(new Date(baslangic)));
  const [saat, setSaat] = useState(() => yerelSaat(new Date(baslangic)));
  const [hata, setHata] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);

  async function iptalEt() {
    if (!confirm("Bu randevuyu iptal etmek istediğine emin misin?")) return;
    setYukleniyor(true);
    setHata("");
    const res = await fetch(`/api/randevular/${id}`, { method: "PATCH" });
    setYukleniyor(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setHata(json.error ?? "Bir hata oluştu.");
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
    setTarih(yerelTarih(new Date(baslangic)));
    setSaat(yerelSaat(new Date(baslangic)));
    setHata("");
    setModalAcik(true);
  }

  async function kaydet() {
    if (!hizmetler.some((h) => h.id === seciliHizmetId)) { setHata("Hizmet seçin."); return; }
    setYukleniyor(true);
    setHata("");
    const res = await fetch(`/api/randevular/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hizmet_id: seciliHizmetId, tarih, saat }),
    });
    setYukleniyor(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setHata(json.error ?? "Bir hata oluştu.");
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
    function tus(e: KeyboardEvent) {
      if (e.key === "Escape") setModalAcik(false);
    }
    if (modalAcik) {
      document.addEventListener("mousedown", kapat);
      document.addEventListener("keydown", tus);
    }
    return () => {
      document.removeEventListener("mousedown", kapat);
      document.removeEventListener("keydown", tus);
    };
  }, [modalAcik]);

  return (
    <>
      <div className="flex gap-2">
        <button onClick={duzenleAc} className="btn btn-cizgili btn-kucuk">
          Düzenle
        </button>
        <button onClick={iptalEt} disabled={yukleniyor} className="btn btn-tehlike btn-kucuk">
          {yukleniyor ? "..." : "İptal"}
        </button>
      </div>

      {hata && !modalAcik && <p className="text-xs text-hata mt-1">{hata}</p>}

      {modalAcik && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="duzenle-baslik"
            className="kart w-full sm:max-w-sm p-6 rounded-b-none sm:rounded-[var(--radius-kart)] shadow-[0_30px_80px_-20px_rgb(0_0_0/0.9)]"
          >
            <h2 id="duzenle-baslik" className="text-xl font-bold mb-5">
              Randevuyu <span className="text-turuncu">düzenle</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="etiket" htmlFor="d-hizmet">Hizmet</label>
                <select
                  id="d-hizmet"
                  value={seciliHizmetId}
                  onChange={(e) => setSeciliHizmetId(e.target.value)}
                  className="girdi"
                >
                  <option value="">Seçin...</option>
                  {hizmetler.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.ad} ({h.sure_dakika} dk)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="etiket" htmlFor="d-tarih">Tarih</label>
                  <input id="d-tarih" type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} className="girdi" />
                </div>
                <div>
                  <label className="etiket" htmlFor="d-saat">Saat</label>
                  <input id="d-saat" type="time" value={saat} onChange={(e) => setSaat(e.target.value)} className="girdi" />
                </div>
              </div>

              {hata && <p className="uyari-kutusu uyari-hata">{hata}</p>}
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={() => setModalAcik(false)} className="btn btn-cizgili flex-1">
                Vazgeç
              </button>
              <button onClick={kaydet} disabled={yukleniyor} className="btn btn-ana flex-1">
                {yukleniyor ? "..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

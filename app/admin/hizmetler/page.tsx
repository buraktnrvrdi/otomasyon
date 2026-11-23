"use client";

import { useEffect, useState } from "react";
import SayfaBasligi from "@/components/SayfaBasligi";
import { ArtiIkon, MakasIkon } from "@/components/ikonlar";

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
  const [yuklendi, setYuklendi] = useState(false);
  const [yeni, setYeni] = useState(BOS);
  const [ekleniyor, setEkleniyor] = useState(false);
  const [siliniyor, setSiliniyor] = useState<string | null>(null);

  async function yukle() {
    const r = await fetch("/api/admin/hizmetler");
    const data = await r.json();
    if (Array.isArray(data)) setHizmetler(data);
    setYuklendi(true);
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
    if (!confirm("Bu hizmeti silmek istediğine emin misin?")) return;
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
      <SayfaBasligi baslik="Hizmetler" vurgu="ve fiyatlar" aciklama="Botun müşterilere sunduğu hizmetler" />

      <div className="space-y-2.5 mb-10">
        {yuklendi && hizmetler.length === 0 && (
          <div className="kart p-8 text-center">
            <MakasIkon className="w-8 h-8 text-silik mx-auto mb-3" />
            <p className="text-soluk text-sm">Henüz hizmet eklenmedi. İlk hizmetini aşağıdan ekle.</p>
          </div>
        )}

        {hizmetler.map((h) => (
          <div
            key={h.id}
            className={`kart px-5 py-4 flex flex-wrap items-center gap-x-6 gap-y-3 ${h.aktif ? "" : "opacity-60"}`}
          >
            <div className="flex-1 min-w-[10rem]">
              <p className="font-semibold">{h.ad}</p>
              <p className="text-sm text-soluk mt-0.5">{h.sure_dakika} dakika</p>
            </div>
            <p className="text-lg font-bold tabular-nums">
              {h.fiyat} <span className="text-sm text-soluk font-medium">₺</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => aktifToggle(h)}
                className={`rozet cursor-pointer ${h.aktif ? "rozet-yesil" : "rozet-gri"}`}
                title="Durumu değiştir"
              >
                {h.aktif ? "Aktif" : "Pasif"}
              </button>
              <button
                onClick={() => sil(h.id)}
                disabled={siliniyor === h.id}
                className="btn btn-tehlike btn-kucuk"
              >
                Sil
              </button>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-bold mb-4">
        Yeni <span className="text-turuncu">hizmet</span>
      </h2>
      <form onSubmit={ekle} className="kart p-6 space-y-5">
        <div>
          <label className="etiket" htmlFor="ad">Hizmet Adı</label>
          <input
            id="ad"
            className="girdi"
            placeholder="Saç Kesimi"
            value={yeni.ad}
            onChange={(e) => setYeni({ ...yeni, ad: e.target.value })}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="etiket" htmlFor="sure">Süre (dk)</label>
            <input
              id="sure"
              type="number"
              min={5}
              step={5}
              className="girdi"
              value={yeni.sure_dakika}
              onChange={(e) => setYeni({ ...yeni, sure_dakika: Number(e.target.value) })}
              required
            />
          </div>
          <div>
            <label className="etiket" htmlFor="fiyat">Fiyat (₺)</label>
            <input
              id="fiyat"
              type="number"
              min={0}
              step={10}
              className="girdi"
              value={yeni.fiyat}
              onChange={(e) => setYeni({ ...yeni, fiyat: Number(e.target.value) })}
              required
            />
          </div>
        </div>
        <button type="submit" disabled={ekleniyor} className="btn btn-ana">
          <ArtiIkon className="w-4 h-4" />
          {ekleniyor ? "Ekleniyor..." : "Hizmet Ekle"}
        </button>
      </form>
    </div>
  );
}

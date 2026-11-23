"use client";

import { useEffect, useState } from "react";
import SayfaBasligi from "@/components/SayfaBasligi";

const GUNLER = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
// Pazartesi ile başlayan sıra
const SIRA = [1, 2, 3, 4, 5, 6, 0];

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
    const data = await r.json();
    if (Array.isArray(data)) {
      setSaatler(
        data
          .map((s: Saat) => ({ ...s, acilis: s.acilis.slice(0, 5), kapanis: s.kapanis.slice(0, 5) }))
          .sort((a: Saat, b: Saat) => SIRA.indexOf(a.gun) - SIRA.indexOf(b.gun))
      );
    }
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
      <SayfaBasligi baslik="Çalışma" vurgu="saatleri" aciklama="Bot sadece açık olduğun saatlerde randevu verir" />

      <div className="space-y-2.5">
        {saatler.map((s) => (
          <div key={s.id} className="kart px-5 py-4 flex flex-wrap items-center gap-x-5 gap-y-3">
            <p className="font-semibold w-28">{GUNLER[s.gun]}</p>

            <button
              role="switch"
              aria-checked={!s.kapali}
              onClick={() => {
                set(s.id, "kapali", !s.kapali);
                guncelle({ ...s, kapali: !s.kapali });
              }}
              className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${s.kapali ? "bg-yuzey-3" : "bg-turuncu"}`}
              title={s.kapali ? "Kapalı" : "Açık"}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${s.kapali ? "" : "translate-x-5"}`}
              />
            </button>

            {s.kapali ? (
              <span className="rozet rozet-gri">Kapalı</span>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  aria-label={`${GUNLER[s.gun]} açılış`}
                  className="girdi w-auto py-2"
                  value={s.acilis}
                  onChange={(e) => set(s.id, "acilis", e.target.value)}
                />
                <span className="text-silik">–</span>
                <input
                  type="time"
                  aria-label={`${GUNLER[s.gun]} kapanış`}
                  className="girdi w-auto py-2"
                  value={s.kapanis}
                  onChange={(e) => set(s.id, "kapanis", e.target.value)}
                />
              </div>
            )}

            <div className="ml-auto">
              {!s.kapali && (
                <button onClick={() => guncelle(s)} className="btn btn-cizgili btn-kucuk">
                  {kaydedilen === s.id ? "Kaydedildi ✓" : "Kaydet"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { GonderIkon } from "./ikonlar";

interface Mesaj {
  rol: "kullanici" | "bot";
  metin: string;
}

const ONERILER = ["Hizmetleriniz neler?", "Yarın boş saat var mı?", "Randevularım"];

interface Props {
  isletmeId: string | null;
  isletmeAdi: string;
  ikon?: string;
  altBaslik: string;
  /** isletmeId yokken mesaj gönderilmek istenirse gösterilecek uyarı */
  hazirDegilMesaji?: string;
  className?: string;
}

export default function SohbetPenceresi({
  isletmeId,
  isletmeAdi,
  ikon,
  altBaslik,
  hazirDegilMesaji = "Sohbet şu an kullanılamıyor.",
  className = "",
}: Props) {
  const [mesajlar, setMesajlar] = useState<Mesaj[]>([
    { rol: "bot", metin: "Merhaba! 👋 Randevu almak, boş saatleri görmek ya da randevunu iptal etmek için yazabilirsin." },
  ]);
  const [girdi, setGirdi] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [oturum, setOturum] = useState<string | null>(null);
  const listeRef = useRef<HTMLDivElement>(null);

  // scrollIntoView tüm sayfayı da kaydırır; sadece mesaj listesini kaydır.
  useEffect(() => {
    const liste = listeRef.current;
    if (liste) liste.scrollTo({ top: liste.scrollHeight, behavior: "smooth" });
  }, [mesajlar, yukleniyor]);

  async function gonder(metinParam?: string) {
    const metin = (metinParam ?? girdi).trim();
    if (!metin || yukleniyor) return;

    if (!isletmeId) {
      setMesajlar((m) => [...m, { rol: "bot", metin: hazirDegilMesaji }]);
      return;
    }

    setGirdi("");
    setMesajlar((m) => [...m, { rol: "kullanici", metin }]);
    setYukleniyor(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mesaj: metin, oturum, isletme_id: isletmeId }),
      });
      const data = await res.json();
      if (data.oturum) setOturum(data.oturum);
      setMesajlar((m) => [...m, { rol: "bot", metin: data.yanit ?? data.hata ?? "Bir hata oluştu." }]);
    } catch {
      setMesajlar((m) => [...m, { rol: "bot", metin: "Bağlantı hatası. Tekrar dener misin?" }]);
    } finally {
      setYukleniyor(false);
    }
  }

  const ilkMesaj = mesajlar.length === 1;

  return (
    <div className={`kart flex flex-col overflow-hidden ${className}`}>
      <div className="flex items-center gap-3 px-5 py-4 border-b border-cizgi bg-yuzey-2/60">
        <div className="relative w-11 h-11 shrink-0 rounded-full bg-gradient-to-br from-turuncu-acik to-turuncu-koyu flex items-center justify-center text-xl font-bold text-white">
          {ikon ?? isletmeAdi.charAt(0).toLocaleUpperCase("tr")}
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-basari ring-2 ring-yuzey" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold truncate">{isletmeAdi}</p>
          <p className="text-xs text-soluk">{altBaslik}</p>
        </div>
      </div>

      <div ref={listeRef} className="flex-1 overflow-y-auto px-4 py-5 space-y-3" aria-live="polite">
        {mesajlar.map((m, i) => (
          <div key={i} className={`flex ${m.rol === "kullanici" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[82%] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                m.rol === "kullanici"
                  ? "rounded-2xl rounded-br-md bg-gradient-to-br from-turuncu-acik to-turuncu text-white"
                  : "rounded-2xl rounded-bl-md bg-yuzey-3 text-metin"
              }`}
            >
              {m.metin}
            </div>
          </div>
        ))}

        {yukleniyor && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md bg-yuzey-3 px-4 py-3.5 flex gap-1.5" aria-label="Yazıyor">
              {[0, 150, 300].map((d) => (
                <span key={d} className="w-2 h-2 rounded-full bg-soluk animate-bounce" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        )}

        {ilkMesaj && (
          <div className="flex flex-wrap gap-2 pt-2">
            {ONERILER.map((o) => (
              <button key={o} onClick={() => gonder(o)} className="btn btn-cizgili btn-kucuk">
                {o}
              </button>
            ))}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); gonder(); }}
        className="flex items-end gap-2 p-3 border-t border-cizgi"
      >
        <textarea
          aria-label="Mesaj"
          className="girdi flex-1 resize-none rounded-3xl max-h-32 leading-5"
          rows={1}
          placeholder="Mesaj yaz..."
          value={girdi}
          onChange={(e) => setGirdi(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              gonder();
            }
          }}
        />
        <button
          type="submit"
          aria-label="Gönder"
          disabled={!girdi.trim() || yukleniyor}
          className="btn btn-ana w-11 h-11 p-0 shrink-0"
        >
          <GonderIkon className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}

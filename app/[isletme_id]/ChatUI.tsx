"use client";

import { useState, useRef, useEffect } from "react";

interface Mesaj {
  rol: "kullanici" | "bot";
  metin: string;
}

interface Props {
  isletmeId: string;
  isletmeAdi: string;
}

export default function ChatUI({ isletmeId, isletmeAdi }: Props) {
  const [mesajlar, setMesajlar] = useState<Mesaj[]>([
    { rol: "bot", metin: "Merhaba! Size nasil yardimci olabilirim?" },
  ]);
  const [girdi, setGirdi] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [oturum, setOturum] = useState<string | null>(null);
  const altRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    altRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mesajlar]);

  async function gonder() {
    const metin = girdi.trim();
    if (!metin || yukleniyor) return;

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
      setMesajlar((m) => [
        ...m,
        { rol: "bot", metin: data.yanit ?? data.hata ?? "Hata olustu." },
      ]);
    } catch {
      setMesajlar((m) => [...m, { rol: "bot", metin: "Baglanti hatasi." }]);
    } finally {
      setYukleniyor(false);
    }
  }

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto">
      <div className="bg-green-600 text-white px-4 py-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
          {isletmeAdi.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold">{isletmeAdi}</p>
          <p className="text-xs text-green-100">Randevu Asistani</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#ece5dd]">
        {mesajlar.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.rol === "kullanici" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap shadow-sm ${
                m.rol === "kullanici"
                  ? "bg-[#dcf8c6] text-gray-800 rounded-br-none"
                  : "bg-white text-gray-800 rounded-bl-none"
              }`}
            >
              {m.metin}
            </div>
          </div>
        ))}
        {yukleniyor && (
          <div className="flex justify-start">
            <div className="bg-white px-4 py-2 rounded-lg rounded-bl-none shadow-sm">
              <span className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}
        <div ref={altRef} />
      </div>

      <div className="bg-[#f0f0f0] px-3 py-2 flex gap-2 items-end border-t">
        <textarea
          className="flex-1 resize-none bg-white rounded-full px-4 py-2 text-sm text-gray-800 outline-none max-h-32 leading-5"
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
          onClick={gonder}
          disabled={!girdi.trim() || yukleniyor}
          className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center disabled:opacity-40 shrink-0"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 rotate-45">
            <path d="M2 21L23 12 2 3v7l15 2-15 2v7z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { MAKS_NOT } from "@/lib/musteri-notlari";

export default function MusteriNotu({ musteriWhatsapp, notu }: { musteriWhatsapp: string; notu: string | null }) {
  const router = useRouter();
  const [duzenle, setDuzenle] = useState(false);
  const [metin, setMetin] = useState(notu ?? "");
  const [calisiyor, setCalisiyor] = useState(false);
  const [hata, setHata] = useState("");

  async function kaydet() {
    setCalisiyor(true);
    setHata("");
    const r = await fetch("/api/admin/musteri-notu", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ musteri_whatsapp: musteriWhatsapp, notu: metin }),
    });
    const json = await r.json().catch(() => ({}));
    setCalisiyor(false);
    if (!r.ok) {
      setHata(json.hata ?? "Kaydedilemedi.");
      return;
    }
    setDuzenle(false);
    router.refresh();
  }

  if (!duzenle) {
    return (
      <button
        onClick={() => { setMetin(notu ?? ""); setDuzenle(true); }}
        className="group flex items-start gap-2 text-left text-sm max-w-[18rem]"
        title="Notu düzenle"
      >
        {notu ? (
          <span className="text-metin whitespace-pre-wrap break-words">{notu}</span>
        ) : (
          <span className="text-silik">Not ekle</span>
        )}
        <Pencil className="w-3.5 h-3.5 mt-0.5 shrink-0 text-silik group-hover:text-turuncu" aria-hidden />
      </button>
    );
  }

  return (
    <div className="space-y-2 min-w-[14rem]">
      <textarea
        className="girdi resize-none text-sm"
        rows={3}
        maxLength={MAKS_NOT}
        value={metin}
        onChange={(e) => setMetin(e.target.value)}
        placeholder="Örn: Hassas saç derisi, boya alerjisi var"
        aria-label="Müşteri notu"
        autoFocus
      />
      <div className="flex items-center gap-2">
        <button onClick={kaydet} disabled={calisiyor} className="btn btn-ana btn-kucuk">
          {calisiyor ? "Kaydediliyor..." : "Kaydet"}
        </button>
        <button onClick={() => setDuzenle(false)} disabled={calisiyor} className="btn btn-cizgili btn-kucuk">
          Vazgeç
        </button>
      </div>
      {hata && <p className="text-xs text-hata">{hata}</p>}
    </div>
  );
}

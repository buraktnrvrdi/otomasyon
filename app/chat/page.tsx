"use client";

import { useEffect, useState } from "react";
import SayfaBasligi from "@/components/SayfaBasligi";
import SohbetPenceresi from "@/components/SohbetPenceresi";

export default function ChatPage() {
  const [isletme, setIsletme] = useState<{ id: string; ad: string; ikon?: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/isletme")
      .then((r) => r.json())
      .then((d) => { if (d.id) setIsletme({ id: d.id, ad: d.ad, ikon: d.ikon }); })
      .catch(() => {});
  }, []);

  return (
    <div>
      <SayfaBasligi
        baslik="Botu"
        vurgu="test et"
        aciklama="Müşterinin WhatsApp'ta konuşacağı botun aynısı. Burada alınan randevular gerçek kaydedilir."
      />
      <SohbetPenceresi
        isletmeId={isletme?.id ?? null}
        isletmeAdi={isletme?.ad ?? "Randevu Asistanı"}
        ikon={isletme?.ikon}
        altBaslik="Test modu · çevrimiçi"
        hazirDegilMesaji="Test için önce panele giriş yapmalısın."
        className="h-[calc(100dvh-16rem)] min-h-[28rem] max-w-2xl"
      />
    </div>
  );
}

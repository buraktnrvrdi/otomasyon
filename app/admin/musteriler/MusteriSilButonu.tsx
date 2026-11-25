"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export default function MusteriSilButonu({ musteriWhatsapp, ad }: { musteriWhatsapp: string; ad: string }) {
  const router = useRouter();
  const [calisiyor, setCalisiyor] = useState(false);
  const [hata, setHata] = useState("");

  async function sil() {
    if (
      !confirm(
        `${ad} adlı müşterinin adı, numarası ve yazışmaları silinsin mi? Randevu kayıtları isimsiz olarak istatistiklerde kalır. Bu işlem geri alınamaz.`
      )
    ) {
      return;
    }
    setCalisiyor(true);
    setHata("");
    const r = await fetch("/api/admin/musteriler", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ musteri_whatsapp: musteriWhatsapp }),
    });
    const json = await r.json().catch(() => ({}));
    setCalisiyor(false);
    if (!r.ok) {
      setHata(json.hata ?? "Silinemedi.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="text-right">
      <button onClick={sil} disabled={calisiyor} className="btn btn-tehlike btn-kucuk" title="Kişisel verileri sil (KVKK)">
        <Trash2 className="w-3.5 h-3.5" aria-hidden />
        {calisiyor ? "Siliniyor..." : "Verileri sil"}
      </button>
      {hata && <p className="text-xs text-hata mt-1 max-w-[16rem] ml-auto">{hata}</p>}
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  id: string;
  durum: string;
}

export default function GelmediButonu({ id, durum }: Props) {
  const router = useRouter();
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState("");
  const gelmedi = durum === "gelmedi";

  async function degistir() {
    setYukleniyor(true);
    setHata("");
    const res = await fetch(`/api/randevular/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ durum: gelmedi ? "tamamlandi" : "gelmedi" }),
    });
    setYukleniyor(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setHata(json.error ?? "Bir hata oluştu.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-start sm:items-end">
      <button
        onClick={degistir}
        disabled={yukleniyor}
        className={`btn btn-kucuk ${gelmedi ? "btn-cizgili" : "btn-cizgili text-turuncu-acik border-turuncu/35"}`}
      >
        {yukleniyor ? "..." : gelmedi ? "Geldi olarak işaretle" : "Gelmedi"}
      </button>
      {hata && <p className="text-xs text-hata mt-1">{hata}</p>}
    </div>
  );
}

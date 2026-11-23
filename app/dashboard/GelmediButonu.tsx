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
      setHata(json.error ?? "Bir hata olustu.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end">
      <button
        onClick={degistir}
        disabled={yukleniyor}
        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-40 ${
          gelmedi
            ? "border-gray-200 text-gray-500 hover:bg-gray-50"
            : "border-orange-200 text-orange-600 hover:bg-orange-50"
        }`}
      >
        {yukleniyor ? "..." : gelmedi ? "Geldi olarak isaretle" : "Gelmedi"}
      </button>
      {hata && <p className="text-xs text-red-500 mt-1">{hata}</p>}
    </div>
  );
}

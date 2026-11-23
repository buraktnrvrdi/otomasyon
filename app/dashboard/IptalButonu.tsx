"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function IptalButonu({ id }: { id: string }) {
  const router = useRouter();
  const [yukleniyor, setYukleniyor] = useState(false);

  async function iptalEt() {
    if (!confirm("Bu randevuyu iptal etmek istediginize emin misiniz?")) return;
    setYukleniyor(true);
    await fetch(`/api/randevular/${id}`, { method: "PATCH" });
    setYukleniyor(false);
    router.refresh();
  }

  return (
    <button
      onClick={iptalEt}
      disabled={yukleniyor}
      className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-40 transition-colors"
    >
      {yukleniyor ? "..." : "Iptal"}
    </button>
  );
}

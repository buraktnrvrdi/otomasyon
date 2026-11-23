"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SuperLoginPage() {
  const [sifre, setSifre] = useState("");
  const [hata, setHata] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const router = useRouter();

  async function giris(e: React.FormEvent) {
    e.preventDefault();
    setYukleniyor(true);
    setHata("");

    const r = await fetch("/api/super/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sifre }),
    });

    setYukleniyor(false);
    if (r.ok) {
      router.push("/super");
      router.refresh();
    } else {
      setHata("Sifre yanlis.");
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
      <div className="w-full max-w-sm px-4">
        <div className="mb-8">
          <p className="text-white font-semibold text-lg">Super Admin</p>
          <p className="text-white/40 text-sm mt-1">Sadece sistem yoneticisi</p>
        </div>

        <form onSubmit={giris} className="space-y-4">
          <input
            type="password"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-white/30 transition-colors"
            value={sifre}
            onChange={(e) => setSifre(e.target.value)}
            placeholder="••••••••"
            required
          />
          {hata && <p className="text-red-400 text-sm">{hata}</p>}
          <button
            type="submit"
            disabled={yukleniyor}
            className="w-full bg-white text-[#0f1117] py-2.5 rounded-lg text-sm font-semibold disabled:opacity-40 hover:bg-white/90 transition-colors"
          >
            {yukleniyor ? "Giris yapiliyor..." : "Giris Yap"}
          </button>
        </form>
      </div>
    </div>
  );
}

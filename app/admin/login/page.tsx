"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sifre, setSifre] = useState("");
  const [hata, setHata] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const router = useRouter();

  async function giris(e: React.FormEvent) {
    e.preventDefault();
    setYukleniyor(true);
    setHata("");

    const r = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, sifre }),
    });

    setYukleniyor(false);
    if (r.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      const json = await r.json().catch(() => ({}));
      setHata(json.hata ?? "Email veya sifre hatali.");
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1d23] flex items-center justify-center">
      <div className="w-full max-w-sm px-4">
        <div className="mb-8">
          <p className="text-white font-semibold text-lg">Randevu Paneli</p>
          <p className="text-white/40 text-sm mt-1">Devam etmek icin giris yapin</p>
        </div>

        <form onSubmit={giris} className="space-y-4">
          <div>
            <label className="block text-white/60 text-xs font-medium mb-1.5 uppercase tracking-wider">
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-white/30 transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="isletme@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-white/60 text-xs font-medium mb-1.5 uppercase tracking-wider">
              Sifre
            </label>
            <input
              type="password"
              autoComplete="current-password"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-white/30 transition-colors"
              value={sifre}
              onChange={(e) => setSifre(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {hata && <p className="text-red-400 text-sm">{hata}</p>}

          <button
            type="submit"
            disabled={yukleniyor}
            className="w-full bg-white text-[#1a1d23] py-2.5 rounded-lg text-sm font-semibold disabled:opacity-40 hover:bg-white/90 transition-colors"
          >
            {yukleniyor ? "Giris yapiliyor..." : "Giris Yap"}
          </button>
        </form>

        <p className="text-center text-white/30 text-xs mt-6">
          Hesabiniz yok mu?{" "}
          <Link href="/kayit" className="text-white/60 hover:text-white underline">
            Davet koduyla kayit ol
          </Link>
        </p>
      </div>
    </div>
  );
}

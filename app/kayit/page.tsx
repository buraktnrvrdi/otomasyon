"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function KayitForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({
    davet_kodu: searchParams.get("kod") ?? "",
    isletme_adi: "",
    email: "",
    sifre: "",
  });
  const [hata, setHata] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [basarili, setBasarili] = useState("");

  async function kayitOl(e: React.FormEvent) {
    e.preventDefault();
    setYukleniyor(true);
    setHata("");

    const r = await fetch("/api/kayit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setYukleniyor(false);

    if (r.ok) {
      setBasarili(form.isletme_adi);
      setTimeout(() => {
        router.push("/admin");
        router.refresh();
      }, 2000);
    } else {
      const json = await r.json().catch(() => ({}));
      setHata(json.hata ?? "Bir hata olustu.");
    }
  }

  if (basarili) {
    return (
      <div className="min-h-screen bg-[#1a1d23] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-white font-semibold text-lg">Hosgeldiniz!</p>
          <p className="text-white/60 text-sm mt-1">{basarili}</p>
          <p className="text-white/30 text-xs mt-3">Panele yonlendiriliyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1d23] flex items-center justify-center">
      <div className="w-full max-w-sm px-4">
        <div className="mb-8">
          <p className="text-white font-semibold text-lg">Hesap Olustur</p>
          <p className="text-white/40 text-sm mt-1">Davet kodunuzla kayit olun</p>
        </div>

        <form onSubmit={kayitOl} className="space-y-4">
          <div>
            <label className="block text-white/60 text-xs font-medium mb-1.5 uppercase tracking-wider">
              Davet Kodu
            </label>
            <input
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-white/30 transition-colors uppercase tracking-widest"
              value={form.davet_kodu}
              onChange={(e) => setForm({ ...form, davet_kodu: e.target.value.toUpperCase() })}
              placeholder="XXXXXXXX"
              required
            />
          </div>

          <div>
            <label className="block text-white/60 text-xs font-medium mb-1.5 uppercase tracking-wider">
              Isletme Adi
            </label>
            <input
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-white/30 transition-colors"
              value={form.isletme_adi}
              onChange={(e) => setForm({ ...form, isletme_adi: e.target.value })}
              placeholder="Ornek Berber Salonu"
              required
            />
          </div>

          <div>
            <label className="block text-white/60 text-xs font-medium mb-1.5 uppercase tracking-wider">
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-white/30 transition-colors"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
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
              autoComplete="new-password"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-white/30 transition-colors"
              value={form.sifre}
              onChange={(e) => setForm({ ...form, sifre: e.target.value })}
              placeholder="En az 6 karakter"
              minLength={8}
              required
            />
          </div>

          {hata && <p className="text-red-400 text-sm">{hata}</p>}

          <button
            type="submit"
            disabled={yukleniyor}
            className="w-full bg-white text-[#1a1d23] py-2.5 rounded-lg text-sm font-semibold disabled:opacity-40 hover:bg-white/90 transition-colors"
          >
            {yukleniyor ? "Hesap olusturuluyor..." : "Kayit Ol"}
          </button>
        </form>

        <p className="text-center text-white/30 text-xs mt-6">
          Zaten hesabiniz var mi?{" "}
          <Link href="/admin/login" className="text-white/60 hover:text-white underline">
            Giris yapin
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function KayitPage() {
  return (
    <Suspense>
      <KayitForm />
    </Suspense>
  );
}

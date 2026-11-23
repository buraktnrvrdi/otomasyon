"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import GirisKabugu from "@/components/GirisKabugu";

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
      router.push("/dashboard");
      router.refresh();
    } else {
      const json = await r.json().catch(() => ({}));
      setHata(json.hata ?? "E-posta veya şifre hatalı.");
    }
  }

  return (
    <GirisKabugu
      baslik="Tekrar"
      vurgu="hoş geldin"
      aciklama="Salon paneline giriş yap"
      alt={
        <>
          Hesabın yok mu?{" "}
          <Link href="/kayit" className="text-metin font-semibold hover:text-turuncu transition-colors">
            Davet koduyla kayıt ol
          </Link>
        </>
      }
    >
      <form onSubmit={giris} className="space-y-5">
        <div>
          <label className="etiket" htmlFor="email">E-posta</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="girdi"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="salon@ornek.com"
            required
          />
        </div>

        <div>
          <label className="etiket" htmlFor="sifre">Şifre</label>
          <input
            id="sifre"
            type="password"
            autoComplete="current-password"
            className="girdi"
            value={sifre}
            onChange={(e) => setSifre(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>

        {hata && <p className="uyari-kutusu uyari-hata">{hata}</p>}

        <button type="submit" disabled={yukleniyor} className="btn btn-ana w-full">
          {yukleniyor ? "Giriş yapılıyor..." : "Giriş Yap"}
        </button>
      </form>
    </GirisKabugu>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import GirisKabugu from "@/components/GirisKabugu";

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
      const json = await r.json().catch(() => ({}));
      setHata(json.hata ?? "Şifre yanlış.");
    }
  }

  return (
    <GirisKabugu baslik="Süper" vurgu="admin" aciklama="Yalnızca sistem yöneticisi">
      <form onSubmit={giris} className="space-y-5">
        <div>
          <label className="etiket" htmlFor="sifre">Yönetici Şifresi</label>
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

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import GirisKabugu from "@/components/GirisKabugu";

export default function YeniSifrePage() {
  const [sifre, setSifre] = useState("");
  const [tekrar, setTekrar] = useState("");
  const [hata, setHata] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const router = useRouter();

  async function kaydet(e: React.FormEvent) {
    e.preventDefault();
    setHata("");
    if (sifre.length < 8) return setHata("Şifre en az 8 karakter olmalı.");
    if (sifre !== tekrar) return setHata("Şifreler aynı değil.");

    setYukleniyor(true);
    const r = await fetch("/api/admin/sifre-guncelle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sifre }),
    });
    const json = await r.json().catch(() => ({}));
    setYukleniyor(false);

    if (r.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setHata(json.hata ?? "Şifre güncellenemedi.");
    }
  }

  return (
    <GirisKabugu baslik="Yeni" vurgu="şifre belirle" aciklama="Bundan sonra bu şifreyle giriş yapacaksın">
      <form onSubmit={kaydet} className="space-y-5">
        <div>
          <label className="etiket" htmlFor="sifre">Yeni şifre</label>
          <input
            id="sifre"
            type="password"
            autoComplete="new-password"
            className="girdi"
            value={sifre}
            onChange={(e) => setSifre(e.target.value)}
            placeholder="En az 8 karakter"
            required
          />
        </div>
        <div>
          <label className="etiket" htmlFor="tekrar">Yeni şifre (tekrar)</label>
          <input
            id="tekrar"
            type="password"
            autoComplete="new-password"
            className="girdi"
            value={tekrar}
            onChange={(e) => setTekrar(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>

        {hata && <p className="uyari-kutusu uyari-hata">{hata}</p>}

        <button type="submit" disabled={yukleniyor} className="btn btn-ana w-full">
          {yukleniyor ? "Kaydediliyor..." : "Şifreyi kaydet"}
        </button>
      </form>
    </GirisKabugu>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import GirisKabugu from "@/components/GirisKabugu";

export default function SifremiUnuttumPage() {
  const [email, setEmail] = useState("");
  const [hata, setHata] = useState("");
  const [gonderildi, setGonderildi] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);

  // Bağlantı geçersiz ya da süresi dolmuşsa callback buraya hata işaretiyle döner.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("hata")) {
      setHata("Bağlantı geçersiz ya da süresi dolmuş. Yeni bir bağlantı iste.");
    }
  }, []);

  async function gonder(e: React.FormEvent) {
    e.preventDefault();
    setYukleniyor(true);
    setHata("");

    const r = await fetch("/api/admin/sifre-sifirla", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const json = await r.json().catch(() => ({}));

    setYukleniyor(false);
    if (r.ok) setGonderildi(true);
    else setHata(json.hata ?? "İstek gönderilemedi.");
  }

  return (
    <GirisKabugu
      baslik="Şifreni"
      vurgu="sıfırla"
      aciklama="Hesabına bağlı e-posta adresine bir bağlantı göndereceğiz"
      alt={
        <Link href="/admin/login" className="text-metin font-semibold hover:text-turuncu transition-colors">
          Girişe dön
        </Link>
      }
    >
      {gonderildi ? (
        <p className="uyari-kutusu">
          Bu adrese kayıtlı bir hesap varsa şifre sıfırlama bağlantısı gönderildi. Gelen kutunu (ve gereksiz
          klasörünü) kontrol et. Bağlantıyı isteği yaptığın tarayıcıda aç.
        </p>
      ) : (
        <form onSubmit={gonder} className="space-y-5">
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

          {hata && <p className="uyari-kutusu uyari-hata">{hata}</p>}

          <button type="submit" disabled={yukleniyor} className="btn btn-ana w-full">
            {yukleniyor ? "Gönderiliyor..." : "Sıfırlama bağlantısı gönder"}
          </button>
        </form>
      )}
    </GirisKabugu>
  );
}

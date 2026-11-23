"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import GirisKabugu from "@/components/GirisKabugu";
import { TikIkon } from "@/components/ikonlar";

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
        router.push("/dashboard");
        router.refresh();
      }, 2000);
    } else {
      const json = await r.json().catch(() => ({}));
      setHata(json.hata ?? "Bir hata oluştu.");
    }
  }

  if (basarili) {
    return (
      <div className="isima min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-basari/15 text-basari flex items-center justify-center mx-auto mb-5">
            <TikIkon className="w-7 h-7" />
          </div>
          <p className="text-2xl font-bold">Hoş geldin!</p>
          <p className="text-soluk mt-1">{basarili}</p>
          <p className="text-silik text-sm mt-4">Panele yönlendiriliyorsun...</p>
        </div>
      </div>
    );
  }

  return (
    <GirisKabugu
      baslik="Salonunu"
      vurgu="kaydet"
      aciklama="Davet kodunla birkaç saniyede hesabını oluştur"
      alt={
        <>
          Zaten hesabın var mı?{" "}
          <Link href="/admin/login" className="text-metin font-semibold hover:text-turuncu transition-colors">
            Giriş yap
          </Link>
        </>
      }
    >
      <form onSubmit={kayitOl} className="space-y-5">
        <div>
          <label className="etiket" htmlFor="kod">Davet Kodu</label>
          <input
            id="kod"
            className="girdi uppercase tracking-[0.3em] font-semibold"
            value={form.davet_kodu}
            onChange={(e) => setForm({ ...form, davet_kodu: e.target.value.toUpperCase() })}
            placeholder="XXXXXXXXXX"
            required
          />
        </div>

        <div>
          <label className="etiket" htmlFor="ad">Salon Adı</label>
          <input
            id="ad"
            className="girdi"
            value={form.isletme_adi}
            onChange={(e) => setForm({ ...form, isletme_adi: e.target.value })}
            placeholder="Örnek Berber Salonu"
            required
          />
        </div>

        <div>
          <label className="etiket" htmlFor="email">E-posta</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="girdi"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="salon@ornek.com"
            required
          />
        </div>

        <div>
          <label className="etiket" htmlFor="sifre">Şifre</label>
          <input
            id="sifre"
            type="password"
            autoComplete="new-password"
            className="girdi"
            value={form.sifre}
            onChange={(e) => setForm({ ...form, sifre: e.target.value })}
            placeholder="En az 8 karakter"
            minLength={8}
            required
          />
        </div>

        {hata && <p className="uyari-kutusu uyari-hata">{hata}</p>}

        <button type="submit" disabled={yukleniyor} className="btn btn-ana w-full">
          {yukleniyor ? "Hesap oluşturuluyor..." : "Kayıt Ol"}
        </button>
      </form>
    </GirisKabugu>
  );
}

export default function KayitPage() {
  return (
    <Suspense>
      <KayitForm />
    </Suspense>
  );
}

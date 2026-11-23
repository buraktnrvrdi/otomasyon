"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "./Logo";
import IsletmeLogosu from "./IsletmeLogosu";
import {
  ArtiIkon,
  CikisIkon,
  DukkanIkon,
  GecmisIkon,
  KisilerIkon,
  MakasIkon,
  SaatIkon,
  SohbetIkon,
  TakvimIkon,
} from "./ikonlar";

const MENU = [
  { href: "/dashboard", label: "Randevular", Ikon: TakvimIkon },
  { href: "/admin/randevu-ekle", label: "Randevu Ekle", Ikon: ArtiIkon },
  { href: "/admin/gecmis", label: "Geçmiş", Ikon: GecmisIkon },
  { href: "/admin/musteriler", label: "Müşteriler", Ikon: KisilerIkon },
  { href: "/admin/hizmetler", label: "Hizmetler", Ikon: MakasIkon },
  { href: "/admin/saatler", label: "Çalışma Saatleri", Ikon: SaatIkon },
  { href: "/admin/isletme", label: "İşletme Bilgileri", Ikon: DukkanIkon },
  { href: "/chat", label: "Botu Test Et", Ikon: SohbetIkon },
];

export default function PanelKabugu({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isletme, setIsletme] = useState<{ ad: string; ikon: string | null; logoUrl: string | null } | null>(null);
  const mobilMenuRef = useRef<HTMLElement>(null);

  // Mobil menüde aktif sayfayı görünür alana kaydır (sayfayı dikeyde oynatmadan).
  useEffect(() => {
    const menu = mobilMenuRef.current;
    const aktif = menu?.querySelector<HTMLElement>('[aria-current="page"]');
    if (menu && aktif) {
      menu.scrollLeft = aktif.offsetLeft - (menu.clientWidth - aktif.offsetWidth) / 2;
    }
  }, [pathname]);

  useEffect(() => {
    fetch("/api/admin/isletme")
      .then((r) => r.json())
      .then((d) => { if (d?.ad) setIsletme({ ad: d.ad, ikon: d.ikon ?? null, logoUrl: d.logo_url ?? null }); })
      .catch(() => {});
  }, []);

  async function cikis() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  const aktifMi = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="min-h-screen lg:flex">
      {/* Masaüstü: sol menü */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-cizgi bg-yuzey/60 sticky top-0 h-screen">
        <div className="px-5 py-5">
          <Logo />
        </div>

        {isletme && (
          <div className="mx-3 mb-3 flex items-center gap-3 rounded-2xl bg-yuzey-2 px-3 py-2.5">
            <IsletmeLogosu ad={isletme.ad} ikon={isletme.ikon} logoUrl={isletme.logoUrl} boyut="sm" />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{isletme.ad}</p>
              <p className="text-xs text-silik">Salon paneli</p>
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {MENU.map(({ href, label, Ikon }) => {
            const aktif = aktifMi(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={aktif ? "page" : undefined}
                className={`group flex items-center gap-3 rounded-full px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  aktif
                    ? "bg-turuncu/12 text-turuncu-acik"
                    : "text-soluk hover:text-metin hover:bg-white/[0.04]"
                }`}
              >
                <Ikon className={`w-[18px] h-[18px] ${aktif ? "text-turuncu" : "text-silik group-hover:text-soluk"}`} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-cizgi">
          <button
            onClick={cikis}
            className="w-full flex items-center gap-3 rounded-full px-3.5 py-2.5 text-sm font-medium text-silik hover:text-hata hover:bg-hata/[0.06] transition-colors"
          >
            <CikisIkon className="w-[18px] h-[18px]" />
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Mobil: üst çubuk + kaydırılabilir menü */}
      <header className="lg:hidden sticky top-0 z-30 border-b border-cizgi bg-zemin/90 backdrop-blur">
        <div className="flex items-center justify-between px-4 h-14">
          <Logo />
          <button onClick={cikis} className="btn btn-cizgili btn-kucuk" aria-label="Çıkış yap">
            <CikisIkon className="w-4 h-4" />
            Çıkış
          </button>
        </div>
        <nav ref={mobilMenuRef} className="relative flex gap-1.5 overflow-x-auto px-4 pb-3 [scrollbar-width:none]">
          {MENU.map(({ href, label, Ikon }) => {
            const aktif = aktifMi(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={aktif ? "page" : undefined}
                className={`flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ${
                  aktif
                    ? "bg-turuncu text-white border-turuncu"
                    : "border-cizgi text-soluk"
                }`}
              >
                <Ikon className="w-3.5 h-3.5" />
                {label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="flex-1 min-w-0 px-4 py-6 sm:px-8 sm:py-10">
        <div className="max-w-4xl mx-auto">{children}</div>
      </main>
    </div>
  );
}

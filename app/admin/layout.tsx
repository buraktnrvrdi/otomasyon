"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const MENU = [
  { href: "/admin/isletme", label: "Isletme Bilgileri" },
  { href: "/admin/hizmetler", label: "Hizmetler" },
  { href: "/admin/saatler", label: "Calisma Saatleri" },
  { href: "/admin/randevu-ekle", label: "Randevu Ekle" },
  { href: "/admin/gecmis", label: "Gecmis Randevular" },
  { href: "/admin/musteriler", label: "Musteriler" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isletmeAdi, setIsletmeAdi] = useState("");
  const [isletmeIkon, setIsletmeIkon] = useState("🏪");

  useEffect(() => {
    fetch("/api/admin/isletme")
      .then((r) => r.json())
      .then((d) => {
        if (d?.ad) setIsletmeAdi(d.ad);
        if (d?.ikon) setIsletmeIkon(d.ikon);
      })
      .catch(() => {});
  }, []);

  async function cikis() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  return (
    <div className="min-h-screen flex bg-[#f4f5f7]">
      {/* Sidebar */}
      <aside className="w-56 bg-[#1a1d23] flex flex-col shrink-0">
        <div className="px-4 py-4 border-b border-white/10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-xl shrink-0">
            {isletmeIkon}
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm truncate">{isletmeAdi || "Randevu Paneli"}</p>
            <p className="text-white/40 text-xs">Yonetim</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {MENU.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                  active
                    ? "bg-white/10 text-white font-medium"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/10 space-y-0.5">
          <Link
            href="/dashboard"
            className="block px-3 py-2 rounded-md text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors"
          >
            Randevular
          </Link>
          <button
            onClick={cikis}
            className="w-full text-left px-3 py-2 rounded-md text-sm text-white/50 hover:text-red-400 hover:bg-white/5 transition-colors"
          >
            Cikis Yap
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-2xl">{children}</div>
      </main>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { tarihSaatMetni } from "@/lib/utils/zaman";
import { Logo } from "@/components/Logo";
import SayfaBasligi from "@/components/SayfaBasligi";
import { ArtiIkon, CikisIkon, TikIkon } from "@/components/ikonlar";

interface DavetKodu {
  id: string;
  kod: string;
  kullanildi: boolean;
  olusturuldu_at: string;
}

export default function SuperPage() {
  const router = useRouter();
  const [kodlar, setKodlar] = useState<DavetKodu[]>([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [yeniKod, setYeniKod] = useState<string | null>(null);
  const [hata, setHata] = useState("");
  const [kopyalandi, setKopyalandi] = useState<string | null>(null);

  async function yukle() {
    const r = await fetch("/api/super/kodlar", { cache: "no-store" });
    if (r.status === 401) { router.replace("/super/login"); return; }
    if (!r.ok) return;
    setKodlar(await r.json());
  }

  useEffect(() => { yukle(); }, []);

  async function kodUret() {
    setYukleniyor(true);
    setYeniKod(null);
    setHata("");
    const r = await fetch("/api/super/kod-uret", { method: "POST", cache: "no-store" });
    const data = await r.json().catch(() => ({}));
    setYukleniyor(false);
    if (r.status === 401) { router.replace("/super/login"); return; }
    if (!r.ok) { setHata(data.hata ?? "Kod oluşturulamadı."); return; }
    if (data.kod) {
      setYeniKod(data.kod);
      yukle();
    }
  }

  async function cikis() {
    await fetch("/api/super/logout", { method: "POST" });
    router.push("/super/login");
  }

  const aktifSayi = kodlar.filter((k) => !k.kullanildi).length;

  async function linkKopyala(kod: string) {
    await navigator.clipboard.writeText(`${window.location.origin}/kayit?kod=${kod}`);
    setKopyalandi(kod);
    setTimeout(() => setKopyalandi(null), 2000);
  }

  return (
    <div className="isima min-h-screen px-4 py-10 sm:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <Logo />
          <button onClick={cikis} className="btn btn-cizgili btn-kucuk">
            <CikisIkon className="w-4 h-4" />
            Çıkış
          </button>
        </div>

        <SayfaBasligi baslik="Davet" vurgu="kodları" aciklama="Yeni salonlar bu kodlarla kayıt olur">
          <button onClick={kodUret} disabled={yukleniyor} className="btn btn-ana">
            <ArtiIkon className="w-4 h-4" />
            {yukleniyor ? "Oluşturuluyor..." : "Yeni Kod Üret"}
          </button>
        </SayfaBasligi>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="kart p-5">
            <p className="etiket mb-1">Aktif</p>
            <p className="text-3xl font-bold text-turuncu">{aktifSayi}</p>
          </div>
          <div className="kart p-5">
            <p className="etiket mb-1">Kullanılmış</p>
            <p className="text-3xl font-bold">{kodlar.length - aktifSayi}</p>
          </div>
        </div>

        {hata && <p className="uyari-kutusu uyari-hata mb-6">{hata}</p>}

        {yeniKod && (
          <div className="kart mb-6 p-6 border-turuncu/40 bg-gradient-to-br from-turuncu/15 to-transparent">
            <p className="etiket text-turuncu-acik">Yeni kod hazır</p>
            <p className="text-3xl font-bold tracking-[0.25em] mt-1">{yeniKod}</p>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <button onClick={() => linkKopyala(yeniKod)} className="btn btn-beyaz btn-kucuk">
                {kopyalandi === yeniKod ? <><TikIkon className="w-4 h-4" /> Kopyalandı</> : "Kayıt linkini kopyala"}
              </button>
              <span className="text-xs text-soluk">Linki salona gönder, kod otomatik dolar.</span>
            </div>
          </div>
        )}

        <div className="kart overflow-hidden">
          {kodlar.length === 0 ? (
            <p className="text-soluk text-sm p-6">Henüz kod oluşturulmadı.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="tablo">
                <thead>
                  <tr>
                    <th>Kod</th>
                    <th>Durum</th>
                    <th>Oluşturulma</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {kodlar.map((k) => (
                    <tr key={k.id}>
                      <td className="font-semibold tracking-[0.2em]">{k.kod}</td>
                      <td>
                        <span className={`rozet ${k.kullanildi ? "rozet-gri" : "rozet-turuncu"}`}>
                          {k.kullanildi ? "Kullanıldı" : "Aktif"}
                        </span>
                      </td>
                      <td className="text-soluk text-xs">{tarihSaatMetni(new Date(k.olusturuldu_at))}</td>
                      <td className="text-right">
                        {!k.kullanildi && (
                          <button onClick={() => linkKopyala(k.kod)} className="btn btn-cizgili btn-kucuk">
                            {kopyalandi === k.kod ? "Kopyalandı" : "Linki kopyala"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

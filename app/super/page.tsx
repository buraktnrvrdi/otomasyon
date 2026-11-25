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

interface Uyari {
  id: string;
  baslik: string;
  detay: string | null;
  adet: number;
  son_olusma_at: string;
}

export default function SuperPage() {
  const router = useRouter();
  const [kodlar, setKodlar] = useState<DavetKodu[]>([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [yeniKod, setYeniKod] = useState<string | null>(null);
  const [hata, setHata] = useState("");
  const [kopyalandi, setKopyalandi] = useState<string | null>(null);
  const [uyarilar, setUyarilar] = useState<Uyari[]>([]);
  const [uyariHazir, setUyariHazir] = useState(true);

  async function yukle() {
    const r = await fetch("/api/super/kodlar", { cache: "no-store" });
    if (r.status === 401) { router.replace("/super/login"); return; }
    if (!r.ok) return;
    setKodlar(await r.json());
  }

  async function uyariYukle() {
    const r = await fetch("/api/super/uyarilar", { cache: "no-store" });
    if (r.status === 401) { router.replace("/super/login"); return; }
    if (!r.ok) return;
    const json = await r.json();
    setUyarilar(json.uyarilar ?? []);
    setUyariHazir(json.hazir !== false);
  }

  async function okunduYap(govde: { id: string } | { hepsi: true }) {
    await fetch("/api/super/uyarilar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(govde),
    });
    uyariYukle();
  }

  useEffect(() => {
    yukle();
    uyariYukle();
    // Yeni uyarılar sayfayı yenilemeden görünsün.
    const id = setInterval(uyariYukle, 30_000);
    return () => clearInterval(id);
  }, []);

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

        <section className="mb-10" aria-labelledby="uyarilar-baslik">
          <div className="flex items-center justify-between mb-3">
            <h2 id="uyarilar-baslik" className="etiket flex items-center gap-2">
              Sistem uyarıları
              {uyarilar.length > 0 && <span className="rozet rozet-turuncu">{uyarilar.length}</span>}
            </h2>
            {uyarilar.length > 1 && (
              <button onClick={() => okunduYap({ hepsi: true })} className="btn btn-cizgili btn-kucuk">
                Hepsini okundu yap
              </button>
            )}
          </div>

          {!uyariHazir ? (
            <p className="uyari-kutusu">
              Uyarı tablosu henüz yok. Supabase'de <code>008_uyarilar.sql</code> dosyasını çalıştır.
            </p>
          ) : uyarilar.length === 0 ? (
            <div className="kart p-5 flex items-center gap-3 text-soluk text-sm">
              <TikIkon className="w-4 h-4 text-basari" />
              Her şey yolunda, okunmamış uyarı yok.
            </div>
          ) : (
            <ul className="space-y-2.5">
              {uyarilar.map((u) => (
                <li key={u.id} className="kart p-4 border-turuncu/30 flex flex-wrap items-start gap-3">
                  <div className="flex-1 min-w-[14rem]">
                    <p className="font-semibold">
                      {u.baslik}
                      {u.adet > 1 && <span className="rozet rozet-gri ml-2">{u.adet} kez</span>}
                    </p>
                    {u.detay && <p className="text-sm text-soluk mt-1 break-words">{u.detay}</p>}
                    <p className="text-xs text-silik mt-1.5">Son: {tarihSaatMetni(new Date(u.son_olusma_at))}</p>
                  </div>
                  <button onClick={() => okunduYap({ id: u.id })} className="btn btn-cizgili btn-kucuk">
                    Okundu
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

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

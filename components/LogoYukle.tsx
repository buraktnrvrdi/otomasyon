"use client";

import { useRef, useState } from "react";
import { ImageUp, Trash2 } from "lucide-react";
import IsletmeLogosu from "./IsletmeLogosu";

const HEDEF_BOYUT = 512;

/** Yüklemeden önce görseli küçültür: hızlı yüklenir ve fotoğraf konum bilgisi gibi gizli veriler atılır. */
async function kucult(dosya: File): Promise<Blob> {
  const resim = await createImageBitmap(dosya);
  const oran = Math.min(1, HEDEF_BOYUT / Math.max(resim.width, resim.height));
  const genislik = Math.max(1, Math.round(resim.width * oran));
  const yukseklik = Math.max(1, Math.round(resim.height * oran));

  const tuval = document.createElement("canvas");
  tuval.width = genislik;
  tuval.height = yukseklik;
  const baglam = tuval.getContext("2d");
  if (!baglam) throw new Error("Gorsel islenemedi.");
  baglam.drawImage(resim, 0, 0, genislik, yukseklik);
  resim.close();

  return new Promise((coz, hata) =>
    tuval.toBlob((b) => (b ? coz(b) : hata(new Error("Gorsel islenemedi."))), "image/png")
  );
}

interface Props {
  ad: string;
  ikon: string | null | undefined;
  logoUrl: string | null | undefined;
  onDegisti: (url: string | null) => void;
}

export default function LogoYukle({ ad, ikon, logoUrl, onDegisti }: Props) {
  const girdiRef = useRef<HTMLInputElement>(null);
  const [calisiyor, setCalisiyor] = useState(false);
  const [mesaj, setMesaj] = useState<{ tur: "basari" | "hata"; metin: string } | null>(null);

  async function sec(e: React.ChangeEvent<HTMLInputElement>) {
    const dosya = e.target.files?.[0];
    e.target.value = "";
    if (!dosya) return;

    setCalisiyor(true);
    setMesaj(null);
    try {
      const form = new FormData();
      form.append("logo", await kucult(dosya), "logo.png");
      const r = await fetch("/api/admin/logo", { method: "POST", body: form });
      const json = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(json.hata ?? "Logo yuklenemedi.");
      onDegisti(json.logo_url);
      setMesaj({ tur: "basari", metin: "Logo yüklendi." });
    } catch (err) {
      setMesaj({
        tur: "hata",
        metin: err instanceof Error ? err.message : "Logo yuklenemedi. Gecerli bir PNG, JPG veya WebP secin.",
      });
    } finally {
      setCalisiyor(false);
    }
  }

  async function kaldir() {
    if (!confirm("Logoyu kaldırmak istediğine emin misin? Seçili simge tekrar görünür.")) return;
    setCalisiyor(true);
    setMesaj(null);
    const r = await fetch("/api/admin/logo", { method: "DELETE" });
    const json = await r.json().catch(() => ({}));
    setCalisiyor(false);
    if (!r.ok) {
      setMesaj({ tur: "hata", metin: json.hata ?? "Logo kaldirilamadi." });
      return;
    }
    onDegisti(null);
    setMesaj({ tur: "basari", metin: "Logo kaldırıldı." });
  }

  return (
    <div className="flex flex-wrap items-center gap-5">
      <IsletmeLogosu ad={ad} ikon={ikon} logoUrl={logoUrl} boyut="lg" />

      <div className="min-w-[14rem] flex-1">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => girdiRef.current?.click()} disabled={calisiyor} className="btn btn-cizgili btn-kucuk">
            <ImageUp className="w-4 h-4" aria-hidden />
            {calisiyor ? "Yükleniyor..." : logoUrl ? "Logoyu değiştir" : "Logo yükle"}
          </button>
          {logoUrl && (
            <button type="button" onClick={kaldir} disabled={calisiyor} className="btn btn-tehlike btn-kucuk">
              <Trash2 className="w-4 h-4" aria-hidden />
              Kaldır
            </button>
          )}
        </div>
        <p className="text-xs text-silik mt-2">
          PNG, JPG veya WebP. Kare ya da yatay logolar uyar; şeffaf arka planlı PNG en temiz sonucu verir.
        </p>
        {mesaj && (
          <p className={`text-sm mt-2 ${mesaj.tur === "basari" ? "text-basari" : "text-hata"}`}>{mesaj.metin}</p>
        )}
      </div>

      <input
        ref={girdiRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={sec}
        aria-label="Logo dosyası seç"
      />
    </div>
  );
}

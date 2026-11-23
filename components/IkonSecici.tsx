"use client";

import { IKONLAR, ikonAnahtari, type IkonAnahtari } from "@/lib/isletme-ikon";
import { IKON_BILESENLERI } from "./IsletmeLogosu";

interface Props {
  deger: string | null | undefined;
  onDegisti: (anahtar: IkonAnahtari) => void;
}

export default function IkonSecici({ deger, onDegisti }: Props) {
  const secili = ikonAnahtari(deger);

  return (
    <div role="radiogroup" aria-label="Salon simgesi" className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
      {IKONLAR.map(({ anahtar, etiket }) => {
        const Ikon = IKON_BILESENLERI[anahtar];
        const aktif = anahtar === secili;
        return (
          <button
            key={anahtar}
            type="button"
            role="radio"
            aria-checked={aktif}
            onClick={() => onDegisti(anahtar)}
            className={`group flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 transition-all ${
              aktif
                ? "border-turuncu bg-turuncu/10 text-turuncu-acik"
                : "border-cizgi bg-yuzey-2 text-soluk hover:border-cizgi-guclu hover:text-metin"
            }`}
          >
            <Ikon className="w-6 h-6" strokeWidth={1.7} aria-hidden />
            <span className="text-[11px] font-medium">{etiket}</span>
          </button>
        );
      })}
    </div>
  );
}

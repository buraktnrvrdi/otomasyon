import {
  Brush,
  Crown,
  Droplets,
  Flower2,
  Gem,
  Hand,
  Heart,
  Leaf,
  Scissors,
  Sparkles,
  SprayCan,
  Store,
  type LucideIcon,
} from "lucide-react";
import { ikonAnahtari, type IkonAnahtari } from "@/lib/isletme-ikon";

export const IKON_BILESENLERI: Record<IkonAnahtari, LucideIcon> = {
  makas: Scissors,
  firca: Brush,
  sprey: SprayCan,
  parlak: Sparkles,
  tac: Crown,
  cicek: Flower2,
  damla: Droplets,
  elmas: Gem,
  yaprak: Leaf,
  el: Hand,
  kalp: Heart,
  magaza: Store,
};

const BOYUTLAR = {
  sm: { kutu: "w-9 h-9 rounded-xl", ikon: "w-[18px] h-[18px]" },
  md: { kutu: "w-11 h-11 rounded-2xl", ikon: "w-5 h-5" },
  lg: { kutu: "w-16 h-16 rounded-[1.25rem]", ikon: "w-8 h-8" },
} as const;

interface Props {
  ad: string;
  ikon?: string | null;
  logoUrl?: string | null;
  boyut?: keyof typeof BOYUTLAR;
  className?: string;
}

/** Yüklenen logo varsa onu, yoksa seçilen simgeyi gösterir. */
export default function IsletmeLogosu({ ad, ikon, logoUrl, boyut = "md", className = "" }: Props) {
  const olcu = BOYUTLAR[boyut];

  if (logoUrl) {
    return (
      <div className={`${olcu.kutu} shrink-0 overflow-hidden bg-white ring-1 ring-cizgi-guclu ${className}`}>
        {/* Dış adres olduğu için next/image yerine düz img kullanılır */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUrl} alt={`${ad} logosu`} className="w-full h-full object-contain p-1" loading="lazy" />
      </div>
    );
  }

  const Ikon = IKON_BILESENLERI[ikonAnahtari(ikon)];
  return (
    <div
      className={`${olcu.kutu} shrink-0 flex items-center justify-center text-white bg-gradient-to-br from-turuncu-acik via-turuncu to-turuncu-koyu shadow-[0_8px_24px_-10px_rgb(255_106_31/0.7)] ${className}`}
      role="img"
      aria-label={ad}
    >
      <Ikon className={olcu.ikon} strokeWidth={1.9} aria-hidden />
    </div>
  );
}

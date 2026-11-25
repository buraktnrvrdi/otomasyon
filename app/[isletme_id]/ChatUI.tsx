"use client";

import Link from "next/link";
import SohbetPenceresi from "@/components/SohbetPenceresi";

interface Props {
  isletmeId: string;
  isletmeAdi: string;
  ikon?: string | null;
  logoUrl?: string | null;
}

export default function ChatUI({ isletmeId, isletmeAdi, ikon, logoUrl }: Props) {
  return (
    <div className="isima min-h-dvh flex flex-col items-center justify-center gap-3 p-0 sm:p-6">
      <SohbetPenceresi
        isletmeId={isletmeId}
        isletmeAdi={isletmeAdi}
        ikon={ikon}
        logoUrl={logoUrl}
        altBaslik="Randevu asistanı · çevrimiçi"
        className="w-full max-w-lg h-dvh sm:h-[min(42rem,calc(100dvh-4.5rem))] rounded-none sm:rounded-[var(--radius-kart)]"
      />
      <Link
        href={`/gizlilik/${isletmeId}`}
        className="hidden sm:block text-xs text-silik hover:text-turuncu transition-colors"
      >
        Kişisel verilerin korunması hakkında bilgi
      </Link>
    </div>
  );
}

"use client";

import SohbetPenceresi from "@/components/SohbetPenceresi";

interface Props {
  isletmeId: string;
  isletmeAdi: string;
}

export default function ChatUI({ isletmeId, isletmeAdi }: Props) {
  return (
    <div className="isima min-h-dvh flex items-center justify-center p-0 sm:p-6">
      <SohbetPenceresi
        isletmeId={isletmeId}
        isletmeAdi={isletmeAdi}
        altBaslik="Randevu asistanı · çevrimiçi"
        className="w-full max-w-lg h-dvh sm:h-[min(44rem,calc(100dvh-3rem))] rounded-none sm:rounded-[var(--radius-kart)]"
      />
    </div>
  );
}

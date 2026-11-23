import { LogoIsareti } from "./Logo";

interface Props {
  baslik: string;
  vurgu?: string;
  aciklama: string;
  children: React.ReactNode;
  alt?: React.ReactNode;
}

/** Giriş, kayıt ve süper admin girişi için ortak ekran */
export default function GirisKabugu({ baslik, vurgu, aciklama, children, alt }: Props) {
  return (
    <div className="isima min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-8">
          <LogoIsareti boyut="lg" />
          <h1 className="mt-6 text-3xl font-bold tracking-tight">
            {baslik}
            {vurgu && <span className="text-turuncu"> {vurgu}</span>}
          </h1>
          <p className="text-soluk text-sm mt-2">{aciklama}</p>
        </div>

        <div className="kart p-6 sm:p-7 shadow-[0_30px_80px_-30px_rgb(0_0_0/0.8)]">{children}</div>

        {alt && <div className="text-center text-silik text-sm mt-6">{alt}</div>}
      </div>
    </div>
  );
}

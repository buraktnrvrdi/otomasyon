interface Props {
  baslik: string;
  /** Başlıkta turuncuyla vurgulanacak kelime(ler); baslik'in sonuna eklenir */
  vurgu?: string;
  aciklama?: string;
  children?: React.ReactNode;
}

export default function SayfaBasligi({ baslik, vurgu, aciklama, children }: Props) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {baslik}
          {vurgu && <span className="text-turuncu"> {vurgu}</span>}
        </h1>
        {aciklama && <p className="text-soluk text-sm mt-1.5">{aciklama}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

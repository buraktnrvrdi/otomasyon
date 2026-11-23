/** dublestudio logosu: solda iki krem kare, sağda iki turuncu "D" */
export function LogoIsareti({ boyut = "md" }: { boyut?: "md" | "lg" }) {
  const olcu = boyut === "lg" ? "w-14 h-14" : "w-8 h-8";
  return (
    <svg viewBox="0 0 100 100" className={`${olcu} shrink-0`} role="img" aria-label="dublestudio">
      <rect x="0" y="0" width="45.4" height="45.4" fill="#f4f0ea" />
      <rect x="0" y="54.6" width="45.4" height="45.4" fill="#f4f0ea" />
      <path d="M54.6 0H77.3A22.7 22.7 0 0 1 77.3 45.4H54.6Z" fill="#ff5f1a" />
      <path d="M54.6 54.6H77.3A22.7 22.7 0 0 1 77.3 100H54.6Z" fill="#ff5f1a" />
    </svg>
  );
}

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <LogoIsareti />
      <span className="font-bold tracking-tight text-[15px]">
        duble<span className="text-turuncu">studio</span>
      </span>
    </div>
  );
}

import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

function Ikon({ children, ...p }: P & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...p}
    >
      {children}
    </svg>
  );
}

export const TakvimIkon = (p: P) => (
  <Ikon {...p}><rect x="3" y="4.5" width="18" height="16" rx="3" /><path d="M3 9.5h18M8 2.5v4M16 2.5v4" /></Ikon>
);
export const ArtiIkon = (p: P) => <Ikon {...p}><path d="M12 5v14M5 12h14" /></Ikon>;
export const MakasIkon = (p: P) => (
  <Ikon {...p}><circle cx="6" cy="6" r="2.5" /><circle cx="6" cy="18" r="2.5" /><path d="M8 7.5 20 18M8 16.5 20 6" /></Ikon>
);
export const SaatIkon = (p: P) => <Ikon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Ikon>;
export const GecmisIkon = (p: P) => (
  <Ikon {...p}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 8v4l3 2" /></Ikon>
);
export const KisilerIkon = (p: P) => (
  <Ikon {...p}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6" /></Ikon>
);
export const DukkanIkon = (p: P) => (
  <Ikon {...p}><path d="M4 10v10h16V10M2.5 10 4.5 4h15l2 6M2.5 10a3 3 0 0 0 6 0 3 3 0 0 0 7 0 3 3 0 0 0 6 0M10 20v-5h4v5" /></Ikon>
);
export const SohbetIkon = (p: P) => (
  <Ikon {...p}><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-5A8 8 0 1 1 21 12Z" /></Ikon>
);
export const CikisIkon = (p: P) => (
  <Ikon {...p}><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l4-4-4-4M14 12H4" /></Ikon>
);
export const GonderIkon = (p: P) => <Ikon {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Ikon>;
export const OkSagIkon = (p: P) => <Ikon {...p}><path d="M9 6l6 6-6 6" /></Ikon>;
export const TikIkon = (p: P) => <Ikon {...p}><path d="M5 12.5 10 17.5 19.5 7" /></Ikon>;
export const AnahtarIkon = (p: P) => (
  <Ikon {...p}><circle cx="8" cy="15" r="4" /><path d="M11 12 20 3M16 7l3 3" /></Ikon>
);

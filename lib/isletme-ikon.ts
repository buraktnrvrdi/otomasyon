/** Salon simgeleri. Veritabanında anahtar saklanır; eski kayıtlar emoji olabilir. */
export const IKONLAR = [
  { anahtar: "makas", etiket: "Makas" },
  { anahtar: "firca", etiket: "Fırça" },
  { anahtar: "sprey", etiket: "Sprey" },
  { anahtar: "parlak", etiket: "Parıltı" },
  { anahtar: "tac", etiket: "Taç" },
  { anahtar: "cicek", etiket: "Çiçek" },
  { anahtar: "damla", etiket: "Bakım" },
  { anahtar: "elmas", etiket: "Elmas" },
  { anahtar: "yaprak", etiket: "Doğal" },
  { anahtar: "el", etiket: "Manikür" },
  { anahtar: "kalp", etiket: "Kalp" },
  { anahtar: "magaza", etiket: "Mağaza" },
] as const;

export type IkonAnahtari = (typeof IKONLAR)[number]["anahtar"];

export const VARSAYILAN_IKON: IkonAnahtari = "makas";

const ESKI_EMOJI: Record<string, IkonAnahtari> = {
  "🏪": "magaza",
  "✂️": "makas",
  "💈": "makas",
  "💇": "makas",
  "💅": "el",
  "🪒": "makas",
  "🧴": "damla",
  "🌟": "parlak",
  "⭐": "parlak",
  "🔥": "parlak",
  "💎": "elmas",
  "🎯": "parlak",
};

export function ikonGecerliMi(deger: unknown): deger is IkonAnahtari {
  return IKONLAR.some((i) => i.anahtar === deger);
}

/** Kayıtlı değeri (anahtar ya da eski emoji) geçerli bir anahtara çevirir. */
export function ikonAnahtari(deger: unknown): IkonAnahtari {
  if (ikonGecerliMi(deger)) return deger;
  if (typeof deger === "string" && ESKI_EMOJI[deger]) return ESKI_EMOJI[deger];
  return VARSAYILAN_IKON;
}

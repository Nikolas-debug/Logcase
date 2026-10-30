// Accent- and case-insensitive match key: "Bisutería" → "bisuteria".
export const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

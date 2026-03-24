import { sr, type TranslationKeys } from "./sr";
import { hr } from "./hr";
import { en } from "./en";

export type Language = "sr" | "hr" | "en";

const translations: Record<Language, TranslationKeys> = {
  sr,
  hr,
  en,
};

export function getTranslations(lang: Language = "sr"): TranslationKeys {
  return translations[lang] || translations.sr;
}

export function t(
  lang: Language,
  section: keyof TranslationKeys,
  key: string
): string {
  const trans = translations[lang] || translations.sr;
  const sectionData = trans[section] as Record<string, string>;
  return sectionData?.[key] || key;
}

export const LANGUAGE_LABELS: Record<Language, string> = {
  sr: "Srpski",
  hr: "Hrvatski",
  en: "English",
};

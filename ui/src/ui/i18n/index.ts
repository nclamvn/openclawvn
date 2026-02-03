// i18n module for OpenClaw UI

import { vi, type Translations } from "./vi";
import { en } from "./en";

export type Language = "vi" | "en";

// Current language - synced with UI settings
let currentLanguage: Language = "vi";

// Translations map
const translations: Record<Language, Translations> = {
  vi,
  en: en as unknown as Translations,
};

// Get current translations
export function t(): Translations {
  return translations[currentLanguage];
}

// Get translations for specific language
export function tLang(lang: Language): Translations {
  return translations[lang] || translations.vi;
}

// Set language
export function setLanguage(lang: Language) {
  currentLanguage = lang;
}

// Get current language
export function getLanguage(): Language {
  return currentLanguage;
}

// Re-export types
export type { Translations };
export { vi, en };

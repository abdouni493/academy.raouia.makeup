import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from './fr.json';
import en from './en.json';
import ar from './ar.json';

export const LANGUAGES = [
  { code: 'fr', label: 'Français', short: 'FR', dir: 'ltr' },
  { code: 'ar', label: 'العربية', short: 'ع', dir: 'rtl' },
  { code: 'en', label: 'English', short: 'EN', dir: 'ltr' },
] as const;

export type LangCode = (typeof LANGUAGES)[number]['code'];
const STORAGE_KEY = 'lang';

function initialLanguage(): LangCode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'fr' || saved === 'ar' || saved === 'en') return saved;
  } catch {
    /* storage unavailable */
  }
  return 'fr';
}

export function applyDocumentLanguage(lng: string) {
  const def = LANGUAGES.find((l) => l.code === lng) ?? LANGUAGES[0];
  document.documentElement.lang = def.code;
  document.documentElement.dir = def.dir;
  document.documentElement.classList.toggle('lang-ar', def.code === 'ar');
}

export function localeFor(lng: string): string {
  return lng === 'ar' ? 'ar-DZ' : lng === 'en' ? 'en-GB' : 'fr-FR';
}

i18n.use(initReactI18next).init({
  resources: { fr: { translation: fr }, en: { translation: en }, ar: { translation: ar } },
  lng: initialLanguage(),
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
  returnNull: false,
});

applyDocumentLanguage(i18n.language);
i18n.on('languageChanged', (lng) => {
  applyDocumentLanguage(lng);
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    /* ignore */
  }
});

export default i18n;

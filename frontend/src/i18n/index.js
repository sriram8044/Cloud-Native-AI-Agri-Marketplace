import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationEN from './locales/en/translation.json';
import translationTE from './locales/te/translation.json';
import translationHI from './locales/hi/translation.json';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', locale: 'en-IN' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', locale: 'te-IN' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', locale: 'hi-IN' },
];

export const LANGUAGE_STORAGE_KEY = 'app_language';

const resources = {
  en: { translation: translationEN },
  te: { translation: translationTE },
  hi: { translation: translationHI },
};

// Retrieve saved language preference or default to English
const getSavedLanguage = () => {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && ['en', 'te', 'hi'].includes(saved)) {
      return saved;
    }
  } catch {
    // localStorage not accessible (e.g. sandboxed test env)
  }
  return 'en';
};

const initialLang = getSavedLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLang,
    fallbackLng: 'en',
    supportedLngs: ['en', 'te', 'hi'],
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false, // Avoid suspense boundary issues in SSR/tests
    },
    returnEmptyString: false,
    returnNull: false,
  });

// Update the html lang attribute and persist language choice
const updateHtmlLang = (lng) => {
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.lang = lng;
  }
};

updateHtmlLang(initialLang);

i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
  } catch {
    // ignore storage errors
  }
  updateHtmlLang(lng);
});

export default i18n;

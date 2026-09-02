// src/i18n/utils.ts
import { ui, defaultLang } from './ui';

export function useTranslations(lang: keyof typeof ui) {
  return function t(key: keyof (typeof ui)[typeof defaultLang]): string {
    const val = ui[lang][key];
    return val !== undefined ? val : ui[defaultLang][key];
  };
}
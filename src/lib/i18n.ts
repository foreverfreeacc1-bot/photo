// Supported locales for the public site + admin default seed content.
export const LOCALES = ['ru', 'en'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'ru'

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value)
}

// UI chrome strings that are not stored in the DB (nav, buttons).
export const UI_STRINGS: Record<Locale, Record<string, string>> = {
  ru: {
    'nav.work': 'Услуги',
    'nav.art': 'Портфолио',
    'nav.about': 'О себе',
    'nav.contact': 'Контакты',
    'hero.explore': 'Смотреть услуги',
    'hero.seeArt': 'Смотреть портфолио →',
    'hero.scroll': 'Листайте',
    'work.viewGallery': 'Открыть всю галерею',
    'common.from': 'от',
  },
  en: {
    'nav.work': 'Services',
    'nav.art': 'Portfolio',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'hero.explore': 'Explore services',
    'hero.seeArt': 'See portfolio →',
    'hero.scroll': 'Scroll',
    'work.viewGallery': 'View full gallery',
    'common.from': 'from',
  },
}

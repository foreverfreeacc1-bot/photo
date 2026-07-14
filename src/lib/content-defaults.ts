import type { Locale } from './i18n'

// Default seed content for the public site (photographer). Every string here is
// editable in the CMS (section "content"). The public page overlays DB values on
// top of these defaults, so the site always renders even before it is seeded.
// Keys are grouped by section for the admin editor.

export type ContentMap = Record<string, string>

type DefaultsShape = Record<Locale, ContentMap>

export const CONTENT_DEFAULTS: DefaultsShape = {
  ru: {
    // hero
    'hero.badge': 'Свободен для съёмок — лето 2026',
    'hero.title_1': 'Свет как',
    'hero.title_accent': 'тихая',
    'hero.title_2': 'дисциплина.',
    'hero.subtitle':
      'Независимый фотограф, работаю между Самарой и Москвой. Снимаю портреты, свадьбы и репортажи — для тех, кому важны детали, которые пропускают другие.',
    'hero.stat_since_label': 'Снимаю с',
    'hero.stat_since_value': '2017',
    'hero.stat_projects_label': 'Съёмок',
    'hero.stat_projects_value': '640',
    'hero.stat_clients_label': 'Города',
    'hero.stat_clients_value': '18 городов',
    // marquee
    'marquee.items':
      'Портретная съёмка · Свадьбы · Репортаж · Предметная съёмка · Семейные истории',
    // work / services
    'work.label': 'Услуги',
    'work.title_1': 'Познакомиться с моими услугами —',
    'work.title_2': ' созданными надолго.',
    'work.svc1_title': 'Портретная съёмка',
    'work.svc1_desc': 'Студия или локация. Живые кадры без натянутых поз.',
    'work.svc1_price': 'от 12 000 ₽',
    'work.svc2_title': 'Свадебная съёмка',
    'work.svc2_desc': 'Полный день. История, а не постановка.',
    'work.svc2_price': 'от 45 000 ₽',
    'work.svc3_title': 'Репортаж и события',
    'work.svc3_desc': 'Конференции, концерты, корпоративы.',
    'work.svc3_price': 'от 8 000 ₽/час',
    'work.svc4_title': 'Предметная съёмка',
    'work.svc4_desc': 'Каталоги, карточки товаров, контент для брендов.',
    'work.svc4_price': 'от 15 000 ₽',
    // art / portfolio
    'art.label': 'Портфолио',
    'art.title_1': 'Познакомиться с моими работами —',
    'art.title_2': ' тем, что снимаю для себя.',
    // about
    'about.label': 'О себе',
    'about.quote_1': '«Я работаю медленно, потому что лучший кадр приходит на второй час, а не на первый.',
    'about.quote_2': ' Большая часть того, что я снимаю, — попытка сохранить маленькое чувство целым.»',
    'about.based_label': 'Город',
    'about.based_value': 'Самара, Россия',
    'about.training_label': 'Образование',
    'about.training_value': 'Фотография, Академия искусств, 2016',
    'about.recognition_label': 'Признание',
    'about.recognition_value': '35AWARDS, Призы отрасли',
    // contact
    'contact.label': 'Начнём',
    'contact.title_1': 'Есть съёмка,',
    'contact.title_2': 'которую стоит сделать хорошо?',
    'contact.email': 'hello@photographer.studio',
    'contact.note': 'Отвечаю в течение двух рабочих дней. Шаблон брифа — по запросу.',
    // footer
    'footer.brand': 'Фотограф · Студия',
    'footer.copyright': '© 2026',
    'footer.social_1': 'Instagram',
    'footer.social_2': 'Telegram',
    'footer.social_3': 'VK',
    'footer.built': 'Сделано с заботой',
    // site identity
    'site.name': 'Фотограф',
  },
  en: {
    'hero.badge': 'Available for shoots — Summer 2026',
    'hero.title_1': 'Light as',
    'hero.title_accent': 'quiet',
    'hero.title_2': 'discipline.',
    'hero.subtitle':
      'Independent photographer working between Samara and Moscow. I shoot portraits, weddings and reportage — for people who care about the details others skip.',
    'hero.stat_since_label': 'Since',
    'hero.stat_since_value': '2017',
    'hero.stat_projects_label': 'Shoots',
    'hero.stat_projects_value': '640',
    'hero.stat_clients_label': 'Cities',
    'hero.stat_clients_value': '18 cities',
    'marquee.items':
      'Portraiture · Weddings · Reportage · Product · Family stories',
    'work.label': 'Services',
    'work.title_1': 'Get to know my services —',
    'work.title_2': ' designed for the long view.',
    'work.svc1_title': 'Portrait Photography',
    'work.svc1_desc': 'Studio or location. Alive frames, never stiff poses.',
    'work.svc1_price': 'from ₽12,000',
    'work.svc2_title': 'Wedding Photography',
    'work.svc2_desc': 'Full day. A story, not a staging.',
    'work.svc2_price': 'from ₽45,000',
    'work.svc3_title': 'Reportage & Events',
    'work.svc3_desc': 'Conferences, concerts, corporate.',
    'work.svc3_price': 'from ₽8,000/hr',
    'work.svc4_title': 'Product Photography',
    'work.svc4_desc': 'Catalogues, product cards, brand content.',
    'work.svc4_price': 'from ₽15,000',
    'art.label': 'Portfolio',
    'art.title_1': 'Get to know my work —',
    'art.title_2': ' the frames I make for myself.',
    'about.label': 'About',
    'about.quote_1': '"I work slowly because the best frame arrives in the second hour, never the first.',
    'about.quote_2': ' Most of what I shoot is an attempt to keep a small feeling intact."',
    'about.based_label': 'Based',
    'about.based_value': 'Samara, Russia',
    'about.training_label': 'Training',
    'about.training_value': 'Photography, Academy of Arts, 2016',
    'about.recognition_label': 'Recognition',
    'about.recognition_value': '35AWARDS, Industry prizes',
    'contact.label': "Let's begin",
    'contact.title_1': 'Have a shoot',
    'contact.title_2': 'worth doing well?',
    'contact.email': 'hello@photographer.studio',
    'contact.note': 'Replies within two working days. Brief template available on request.',
    'footer.brand': 'Photographer · Studio',
    'footer.copyright': '© 2026',
    'footer.social_1': 'Instagram',
    'footer.social_2': 'Telegram',
    'footer.social_3': 'VK',
    'footer.built': 'Made with care',
    'site.name': 'Photographer',
  },
}

// Flattened metadata used by the CMS editor to render friendly labels + grouping.
export type ContentFieldMeta = {
  key: string
  section: string
  label: string
  multiline?: boolean
}

export const CONTENT_FIELDS: ContentFieldMeta[] = [
  { key: 'site.name', section: 'identity', label: 'Название / имя' },
  { key: 'hero.badge', section: 'hero', label: 'Плашка доступности' },
  { key: 'hero.title_1', section: 'hero', label: 'Заголовок — часть 1' },
  { key: 'hero.title_accent', section: 'hero', label: 'Заголовок — акцент (курсив)' },
  { key: 'hero.title_2', section: 'hero', label: 'Заголовок — часть 2' },
  { key: 'hero.subtitle', section: 'hero', label: 'Подзаголовок', multiline: true },
  { key: 'hero.stat_since_label', section: 'hero', label: 'Статистика: подпись 1' },
  { key: 'hero.stat_since_value', section: 'hero', label: 'Статистика: значение 1' },
  { key: 'hero.stat_projects_label', section: 'hero', label: 'Статистика: подпись 2' },
  { key: 'hero.stat_projects_value', section: 'hero', label: 'Статистика: значение 2' },
  { key: 'hero.stat_clients_label', section: 'hero', label: 'Статистика: подпись 3' },
  { key: 'hero.stat_clients_value', section: 'hero', label: 'Статистика: значение 3' },
  { key: 'marquee.items', section: 'marquee', label: 'Бегущая строка (через ·)', multiline: true },
  { key: 'work.label', section: 'work', label: 'Метка раздела' },
  { key: 'work.title_1', section: 'work', label: 'Заголовок — часть 1' },
  { key: 'work.title_2', section: 'work', label: 'Заголовок — акцент' },
  { key: 'work.svc1_title', section: 'work', label: 'Услуга 1 — название' },
  { key: 'work.svc1_desc', section: 'work', label: 'Услуга 1 — описание' },
  { key: 'work.svc1_price', section: 'work', label: 'Услуга 1 — цена' },
  { key: 'work.svc2_title', section: 'work', label: 'Услуга 2 — название' },
  { key: 'work.svc2_desc', section: 'work', label: 'Услуга 2 — описание' },
  { key: 'work.svc2_price', section: 'work', label: 'Услуга 2 — цена' },
  { key: 'work.svc3_title', section: 'work', label: 'Услуга 3 — название' },
  { key: 'work.svc3_desc', section: 'work', label: 'Услуга 3 — описание' },
  { key: 'work.svc3_price', section: 'work', label: 'Услуга 3 — цена' },
  { key: 'work.svc4_title', section: 'work', label: 'Услуга 4 — название' },
  { key: 'work.svc4_desc', section: 'work', label: 'Услуга 4 — описание' },
  { key: 'work.svc4_price', section: 'work', label: 'Услуга 4 — цена' },
  { key: 'art.label', section: 'art', label: 'Метка раздела' },
  { key: 'art.title_1', section: 'art', label: 'Заголовок — часть 1' },
  { key: 'art.title_2', section: 'art', label: 'Заголовок — акцент' },
  { key: 'about.label', section: 'about', label: 'Метка раздела' },
  { key: 'about.quote_1', section: 'about', label: 'Цитата — часть 1', multiline: true },
  { key: 'about.quote_2', section: 'about', label: 'Цитата — часть 2', multiline: true },
  { key: 'about.based_label', section: 'about', label: 'Город — подпись' },
  { key: 'about.based_value', section: 'about', label: 'Город — значение' },
  { key: 'about.training_label', section: 'about', label: 'Образование — подпись' },
  { key: 'about.training_value', section: 'about', label: 'Образование — значение' },
  { key: 'about.recognition_label', section: 'about', label: 'Признание — подпись' },
  { key: 'about.recognition_value', section: 'about', label: 'Признание — значение' },
  { key: 'contact.label', section: 'contact', label: 'Метка раздела' },
  { key: 'contact.title_1', section: 'contact', label: 'Заголовок — часть 1' },
  { key: 'contact.title_2', section: 'contact', label: 'Заголовок — акцент' },
  { key: 'contact.email', section: 'contact', label: 'Email' },
  { key: 'contact.note', section: 'contact', label: 'Примечание', multiline: true },
  { key: 'footer.brand', section: 'footer', label: 'Название в футере' },
  { key: 'footer.copyright', section: 'footer', label: 'Копирайт' },
  { key: 'footer.social_1', section: 'footer', label: 'Соцсеть 1' },
  { key: 'footer.social_2', section: 'footer', label: 'Соцсеть 2' },
  { key: 'footer.social_3', section: 'footer', label: 'Соцсеть 3' },
  { key: 'footer.built', section: 'footer', label: 'Подпись внизу' },
]

export function mergeContent(
  locale: Locale,
  rows: { key: string; value: string }[],
): ContentMap {
  const merged: ContentMap = { ...CONTENT_DEFAULTS[locale] }
  for (const row of rows) {
    if (row.value != null && row.value !== '') merged[row.key] = row.value
  }
  return merged
}

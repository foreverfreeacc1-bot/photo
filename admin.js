(function () {
  'use strict';

  var API = '/api/';
  var csrf = '';
  var LIMITS = { direct: false, keepOrig: true, maxUpload: 4 * 1024 * 1024, local: false, storage: '', avifQuality: 90 };
  var saved = null;
  var draft = null;
  var baseJson = '';
  var active = 'loader';
  var device = 'desktop';
  var screenMode = 'desktop';
  var uploadCallback = null;
  var uploadLimit = 0;
  var dirtySections = {};

  var sections = [
    { id: 'loader', index: '01', label: 'Лоадер', title: 'Первое впечатление', note: 'Фотографии в центре, заголовок и короткая подпись.' },
    { id: 'home', index: '02', label: 'Главная страница', title: 'Главная страница', note: 'Отдельные кадры для широких, средних и мобильных экранов.' },
    { id: 'portfolio', index: '03', label: 'Портфолио', title: 'Портфолио', note: 'Альбомы, фотографии, превью каждого раздела и блок о себе.' },
    { id: 'work', index: '04', label: 'Услуги', title: 'Услуги', note: 'Карточки услуг и понятные этапы работы с клиентом.' },
    { id: 'contacts', index: '05', label: 'Контакты', title: 'Контакты', note: 'Ссылки, по которым посетитель сможет быстро связаться с вами.' }
  ];

  var $ = function (s, root) { return (root || document).querySelector(s); };
  var $$ = function (s, root) { return Array.prototype.slice.call((root || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  var clone = function (v) { return JSON.parse(JSON.stringify(v)); };
  var uid = function () { return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) { var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); }); };

  var NATIVE_LOADER = {
    title: { ru: 'ALISA MITEROVA', en: 'ALISA MITEROVA' },
    sub1: { ru: 'Профессиональный фотограф из Москвы, специализирующийся на портретной, свадебной и коммерческой фотографии.', en: 'Professional photographer from Moscow, specializing in portrait, wedding and commercial photography.' },
    sub2: { ru: 'Индивидуальный подход, внимание к деталям и естественная эстетика в каждом кадре.', en: 'Individual approach, attention to detail and natural aesthetics in every frame.' }
  };

var CONTACT_ICONS = { telegram: '<svg viewBox="0 0 24 24" fill="currentColor" fill-rule="evenodd" aria-hidden="true"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>', instagram: '<svg viewBox="0 0 24 24" fill="currentColor" fill-rule="evenodd" aria-hidden="true"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 5.4a4.6 4.6 0 1 0 0 9.2 4.6 4.6 0 0 0 0-9.2zm0 1.8a2.8 2.8 0 1 1 0 5.6 2.8 2.8 0 0 1 0-5.6zm5.15-3.6a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2z"/></svg>', max: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 720" aria-hidden="true"><path fill="currentColor" d="M350.4,9.6C141.8,20.5,4.1,184.1,12.8,390.4c3.8,90.3,40.1,168,48.7,253.7,2.2,22.2-4.2,49.6,21.4,59.3,31.5,11.9,79.8-8.1,106.2-26.4,9-6.1,17.6-13.2,24.2-22,27.3,18.1,53.2,35.6,85.7,43.4,143.1,34.3,299.9-44.2,369.6-170.3C799.6,291.2,622.5-4.6,350.4,9.6h0ZM269.4,504c-11.3,8.8-22.2,20.8-34.7,27.7-18.1,9.7-23.7-.4-30.5-16.4-21.4-50.9-24-137.6-11.5-190.9,16.8-72.5,72.9-136.3,150-143.1,78-6.9,150.4,32.7,183.1,104.2,72.4,159.1-112.9,316.2-256.4,218.6h0Z"/></svg>', phone: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>' };
var FAQ_RU_N = [
    {id:'q1',q:'В каких жанрах вы работаете?',a:'Специализируюсь на портрете, fashion, lifestyle и коммерческой фотографии. Также берусь за личные проекты в жанрах стрит и документальная фотография.'},
    {id:'q2',q:'Сколько времени занимает обработка фотографий?',a:'Стандартный срок — 5-7 рабочих дней после съёмки. Срочная обработка (1-2 дня) доступна за дополнительную плату.'},
    {id:'q3',q:'Сколько фотографий я получу?',a:'Количество зависит от пакета: мини-съёмки — 10-15 обработанных кадров, стандартные — 25-40, расширенные — от 60. Точное количество оговаривается при бронировании.'},
    {id:'q4',q:'Вы снимаете на выезде или только в студии?',a:'Оба варианта доступны. Работаю как в студии, так и на выезде — парки, крыши, кафе, лофты. Выезд за город тоже возможен, с учётом транспортных расходов.'},
    {id:'q5',q:'Какие способы оплаты вы принимаете?',a:'Принимаю банковский перевод, оплату картой и наличные. Для подтверждения бронирования необходим задаток 50%; остаток оплачивается в день съёмки.'},
    {id:'q6',q:'Что происходит при отмене или переносе съёмки?',a:'Перенос бесплатен при запросе не менее чем за 48 часов. Отмена в течение 48 часов влечёт потерю задатка. Форс-мажорные ситуации рассматриваются индивидуально.'}
  ];
var FAQ_EN_N = [
    {id:'q1',q:'What genres of photography do you work with?',a:'I specialise in portrait, fashion, lifestyle and commercial photography. I also take on personal projects in street and documentary genres.'},
    {id:'q2',q:'How long does it take to receive the edited photos?',a:'Standard turnaround is 5-7 business days after the shoot. Rush editing (1-2 days) is available for an additional fee.'},
    {id:'q3',q:'How many photos will I receive?',a:'The number depends on the package: mini-sessions include 10-15 edited photos, standard sessions 25-40, and extended shoots 60+. Exact numbers are agreed when booking.'},
    {id:'q4',q:'Do you shoot on location or only in the studio?',a:'Both options are available. I work both in studio and on location — parks, rooftops, cafes, industrial spaces. Travel outside the city is also possible with a travel fee.'},
    {id:'q5',q:'What payment methods do you accept?',a:'I accept bank transfers, card payments and cash. A 50% deposit is required to confirm the booking; the balance is paid on the day of the shoot.'},
    {id:'q6',q:'What happens if the shoot is cancelled or postponed?',a:'Rescheduling is free if requested at least 48 hours in advance. Cancellations within 48 hours forfeit the deposit. Force-majeure situations are handled individually.'}
  ];
var NATIVE_FAQ = FAQ_RU_N.map(function (r) { var e = null; for (var i = 0; i < FAQ_EN_N.length; i++) if (FAQ_EN_N[i].id === r.id) e = FAQ_EN_N[i]; return { id: r.id, q: { ru: r.q, en: e ? e.q : '' }, a: { ru: r.a, en: e ? e.a : '' } }; });
function fmtPhone(raw) {
    var d = String(raw || '').replace(/\D/g, '');
    if (!d) return '';
    if (d[0] === '8') d = '7' + d.slice(1);
    if (d[0] !== '7') d = '7' + d;
    d = d.slice(0, 11);
    var out = '+7';
    if (d.length > 1) out += ' ' + d.slice(1, 4);
    if (d.length > 4) out += ' ' + d.slice(4, 7);
    if (d.length > 7) out += '-' + d.slice(7, 9);
    if (d.length > 9) out += '-' + d.slice(9, 11);
    return out;
  }

  function contactAuto(type, raw) {
    var v = String(raw || '').trim();
    if (type === 'email' || /^mailto:/i.test(v) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      var em = v.replace(/^mailto:/i, '').trim();
      return { l: 'EMAIL', s: em, h: em ? 'mailto:' + em : '' };
    }
    if (type === 'phone') {
      var fp = fmtPhone(v);
      var pd = fp.replace(/\D/g, '');
      return { l: '\u0422\u0415\u041b\u0415\u0424\u041e\u041d', s: fp, h: pd.length > 4 ? 'tel:+' + pd : '' };
    }
    if (type === 'telegram') {
      var th = v.replace(/^(https?:\/\/)?(www\.)?t\.me\//i, '').replace(/^@/, '').replace(/\/+$/, '');
      return { l: 'TELEGRAM', s: th ? '@' + th : '', h: th ? 'https://t.me/' + th : '' };
    }
    if (type === 'instagram') {
      var ih = v.replace(/^(https?:\/\/)?(www\.)?instagram\.com\//i, '').replace(/^@/, '').replace(/\/+$/, '');
      return { l: 'INSTAGRAM', s: ih ? '@' + ih : '', h: ih ? 'https://instagram.com/' + ih : '' };
    }
    var mu = v.replace(/^(https?:\/\/)?(www\.)?max\.ru\/?/i, '').replace(/^@/, '').replace(/\/+$/, '');
    if (mu && !/[\/.:?#\s]/.test(mu)) return { l: 'MAX', s: '@' + mu, h: 'https://max.ru/' + mu };
    var url = v;
    if (url && !/^https?:\/\//i.test(url)) url = 'https://' + url;
    var dom = url.replace(/^https?:\/\//i, '').split('/')[0];
    return { l: 'MAX', s: dom, h: url };
  }

var NATIVE_HOME = {"tagL": {"ru": "\u041a\u041e\u041b\u041b\u0415\u041a\u0426\u0418\u042f", "en": "COLLECTION"}, "smallL": {"ru": "\u0418\u0437\u0431\u0440\u0430\u043d\u043d\u044b\u0435 \u0440\u0430\u0431\u043e\u0442\u044b", "en": "Selected works"}, "subL": {"ru": "\u041f\u041e\u0414\u0411\u041e\u0420\u041a\u0410 \u041f\u0420\u041e\u0415\u041a\u0422\u041e\u0412, \u041e\u0422\u0420\u0410\u0416\u0410\u042e\u0429\u0418\u0425 \u041c\u041e\u0419 \u0421\u0422\u0418\u041b\u042c,\n\u0412\u041d\u0418\u041c\u0410\u041d\u0418\u0415 \u041a \u041a\u041e\u041c\u041f\u041e\u0417\u0418\u0426\u0418\u0418 \u0418 \u042d\u041c\u041e\u0426\u0418\u042f\u041c", "en": "A SELECTION OF PROJECTS REFLECTING MY STYLE,\nATTENTION TO COMPOSITION AND EMOTION"}, "subR": {"ru": "\u0414\u0410\u0412\u0410\u0419\u0422\u0415 \u041f\u0420\u0415\u0412\u0420\u0410\u0422\u0418\u041c \u0418\u0414\u0415\u042e \u0412 \u0418\u0421\u0422\u041e\u0420\u0418\u042e,\n\u041a\u041e\u0422\u041e\u0420\u0410\u042f \u0421\u041e\u0425\u0420\u0410\u041d\u0418\u0422 \u0421\u0410\u041c\u042b\u0415 \u0412\u0410\u0416\u041d\u042b\u0415 \u041c\u041e\u041c\u0415\u041d\u0422\u042b", "en": "LET\u2019S TURN AN IDEA INTO A STORY\nTHAT KEEPS THE MOST PRECIOUS MOMENTS"}};

  var NATIVE_PF = {
    intro: {
      ru: 'Избранные работы из разных направлений фотографии — от индивидуальных портретов до коммерческих съёмок',
      en: 'Selected works across different photography genres — from individual portraits to commercial shoots'
    },
    aboutBlock: {
      title: { ru: 'Обо мне', en: 'About Me' },
      name: { ru: 'Алиса Митерова', en: 'Alisa Miterova' },
      text: {
        ru: 'Фотограф из Москвы, создающий визуальные истории с акцентом на эстетику, естественный свет и внимание к деталям. Индивидуальный подход к каждой съемке и стремление к безупречному результату позволяют создавать кадры, которые остаются актуальными вне времени.',
        en: 'A photographer from Moscow, creating visual stories with a focus on aesthetics, natural light and attention to detail. An individual approach to every shoot and the pursuit of a flawless result allow for images that remain timeless.'
      }
    }
  };


  var ICON_SET = {
    camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M18 22H4a2 2 0 0 1-2-2V6"/><path d="m22 13-1.296-1.296a2.41 2.41 0 0 0-3.408 0L11 18"/><circle cx="12" cy="8" r="2"/><rect width="16" height="16" x="6" y="2" rx="2"/></svg>',
    image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg>',
    gem: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 2.6 5.6 6.1.8-4.4 4.3 1.1 6.1-5.4-2.9-5.4 2.9 1.1-6.1L3.3 9.4l6.1-.8z"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M19 6.5a5 5 0 0 0-7 0l-.9.9-1-.9a5 5 0 1 0-7 7l8 8 8-8a5 5 0 0 0 0-7z"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.5 2.5 4.5-5"/></svg>'
  };
  var ICON_KEYS = ['camera', 'image', 'book', 'gem', 'star', 'heart', 'pin', 'sun', 'clock', 'check'];
  function iconMarkup(key) { return ICON_SET[key] || ICON_SET.camera; }

  var NATIVE_ALBUMS = [
    { title: { ru: 'ПОРТРЕТЫ', en: 'PORTRAITS' }, desc: { ru: 'Камерные истории одного человека. Студия, город, естественный свет — минимум декораций, максимум взгляда и характера.', en: 'Intimate stories of one person. Studio, city, natural light — minimum decorations, maximum gaze and character.' } },
    { title: { ru: 'СВАДЬБЫ', en: 'WEDDINGS' }, desc: { ru: 'День целиком — от сборов до первого танца. Без постановочной суеты, только живые эмоции.', en: 'The whole day — from getting ready to the first dance. No staged fuss, only real emotions.' } },
    { title: { ru: 'КОММЕРЧЕСКАЯ СЪЕМКА', en: 'COMMERCIAL' }, desc: { ru: 'Съемки для брендов: лукбуки, кампейны, контент для медиа и соцсетей.', en: 'Shoots for brands: lookbooks, campaigns, content for media and social networks.' } },
    { title: { ru: 'ЛАЙФСТАЙЛ', en: 'LIFESTYLE' }, desc: { ru: 'Жизнь как она есть: семейные прогулки, путешествия, повседневные кадры.', en: 'Life as it is: family walks, travels, everyday frames.' } }
  ];

  var NATIVE_PF_STAGES = [
    { icon: 'camera', title: { ru: 'Профессиональное оборудование', en: 'Professional Equipment' }, text: { ru: 'Для съёмок используется современная профессиональная фототехника и светосильная оптика, позволяющие получать детализированные изображения с естественной светопередачей как в студии, так и на открытых локациях. При необходимости применяется профессиональное студийное освещение.', en: 'Modern professional photo equipment and fast lenses are used for shoots, delivering detailed images with natural colour reproduction both in studio and on location. Professional studio lighting is applied when needed.' } },
    { icon: 'camera', title: { ru: 'Авторская обработка', en: 'Signature Editing' }, text: { ru: 'Каждый кадр проходит индивидуальную обработку. Цвет, свет и тональность сохраняют естественность изображения, подчеркивая атмосферу съёмки без чрезмерной ретуши. Главная задача — создать фотографии, которые останутся актуальными спустя годы.', en: 'Every frame is edited individually. Colour, light and tone retain the naturalness of the image, emphasising the atmosphere of the shoot without excessive retouching. The main goal is to create photographs that will remain timeless.' } },
    { icon: 'camera', title: { ru: 'Локации', en: 'Locations' }, text: { ru: 'Провожу съёмки в Москве и Московской области. Возможен выезд в другие города по предварительной договорённости. Работаю как в студиях, так и на городских, природных и интерьерных локациях.', en: 'Shoots in Moscow and the Moscow Region. Travel to other cities is possible by prior arrangement. I work in studios as well as urban, natural and interior locations.' } }
  ];

  var NATIVE_WORK_CARDS = [
    {
      "title": {
        "ru": "ИНДИВИДУАЛЬНАЯ УЛИЧНАЯ / ДОМАШНЯЯ СЪЕМКА",
        "en": "INDIVIDUAL OUTDOOR / HOME SESSION"
      },
      "price": {
        "ru": "12 000 ₽",
        "en": "12,000 RUB"
      },
      "features": {
        "ru": [
          "— длительность 1–1,5 часа",
          "— помощь в подборе образа",
          "— составление мудборда",
          "— от 30 фотографий в ретуши",
          "— готовность до 3 недель"
        ],
        "en": [
          "— duration 1–1.5 hours",
          "— outfit selection help",
          "— moodboard creation",
          "— 30+ retouched photos",
          "— delivery within 3 weeks"
        ]
      }
    },
    {
      "title": {
        "ru": "ПОРТРЕТНАЯ СЪЕМКА",
        "en": "PORTRAIT SESSION"
      },
      "price": {
        "ru": "от 9 000 ₽",
        "en": "from 9,000 RUB"
      },
      "features": {
        "ru": [
          "— длительность 1–2 часа",
          "— 2 образа и локации",
          "— от 40 кадров в обработке",
          "— авторская ретушь",
          "— готовность до 2 недель"
        ],
        "en": [
          "— duration 1–2 hours",
          "— 2 looks and locations",
          "— 40+ edited photos",
          "— author retouching",
          "— delivery within 2 weeks"
        ]
      }
    },
    {
      "title": {
        "ru": "СЕМЕЙНАЯ ФОТОСЕССИЯ",
        "en": "FAMILY PHOTO SESSION"
      },
      "price": {
        "ru": "от 12 000 ₽",
        "en": "from 12,000 RUB"
      },
      "features": {
        "ru": [
          "— длительность 1,5–2 часа",
          "— репортаж и постановка",
          "— 60+ кадров в обработке",
          "— авторская ретушь",
          "— готовность до 2 недель"
        ],
        "en": [
          "— duration 1.5–2 hours",
          "— reportage and staging",
          "— 60+ edited photos",
          "— author retouching",
          "— delivery within 2 weeks"
        ]
      }
    },
    {
      "title": {
        "ru": "СВАДЕБНАЯ СЪЕМКА",
        "en": "WEDDING PHOTOGRAPHY"
      },
      "price": {
        "ru": "от 60 000 ₽",
        "en": "from 60,000 RUB"
      },
      "features": {
        "ru": [
          "— полный день до 10 часов",
          "— 400+ кадров в обработке",
          "— тизер за 48 часов",
          "— авторская ретушь",
          "— готовность до 4 недель"
        ],
        "en": [
          "— full day up to 10 hours",
          "— 400+ edited photos",
          "— teaser within 48 hours",
          "— author retouching",
          "— delivery within 4 weeks"
        ]
      }
    }
  ];

  var NATIVE_WORK_STAGES = [
    { icon: 'check', badge: { ru: 'Шаг 1', en: 'Step 1' }, title: { ru: 'Заявка', en: 'Request' }, text: { ru: 'Обсуждаем идею, формат и дату съёмки', en: 'We discuss the idea, format and shoot date' } },
    { icon: 'clock', badge: { ru: 'Шаг 2', en: 'Step 2' }, title: { ru: 'Подготовка', en: 'Preparation' }, text: { ru: 'Референсы, образы и локация', en: 'References, looks and location' } },
    { icon: 'camera', badge: { ru: 'Шаг 3', en: 'Step 3' }, title: { ru: 'Съёмка', en: 'The Shoot' }, text: { ru: 'Лёгкая атмосфера и помощь с позированием', en: 'Easy atmosphere and posing guidance' } },
    { icon: 'star', badge: { ru: 'Шаг 4', en: 'Step 4' }, title: { ru: 'Результат', en: 'Result' }, text: { ru: 'Ретушь и онлайн-галерея готовых кадров', en: 'Retouching and an online gallery' } }
  ];

  function emptyContent() {
    return {
      loader: { title: clone(NATIVE_LOADER.title), subtitle: clone(NATIVE_LOADER.sub1), subtitle2: clone(NATIVE_LOADER.sub2), subtitleM: clone(NATIVE_LOADER.sub1), images: [] },
      home: { desktop: { L: null, R: null }, tablet: { L: null, R: null }, mobile: { L: null, R: null }, texts: clone(NATIVE_HOME) },
      portfolio: { about: { ru: '', en: '' }, intro: clone(NATIVE_PF.intro), aboutBlock: clone(NATIVE_PF.aboutBlock), albums: [] },
      work: { cards: [], stages: [] },
      contacts: [],
      faq: []
    };
  }

  function demoContent() {
    var photos = [
      { id: uid(), url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=1200&q=85', name: 'portrait-01.avif' },
      { id: uid(), url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200&q=85', name: 'portrait-02.avif' },
      { id: uid(), url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1200&q=85', name: 'portrait-03.avif' },
      { id: uid(), url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=85', name: 'wedding-01.avif' }
    ];
    return {
      loader: { title: { ru: 'Алиса Митерова', en: 'Alisa Miterova' }, subtitle: { ru: 'Живопись, графика, дизайн и фотография', en: 'Art, design and photography' }, images: photos.slice(0, 3) },
      home: {
        desktop: { L: photos[0], R: photos[3] },
        tablet: { L: photos[1], R: photos[3] },
        mobile: { L: photos[2], R: photos[3] }
      },
      portfolio: {
        about: { ru: 'Снимаю людей честно и бережно. Ищу в каждом кадре характер, тишину и живое движение.', en: 'I photograph people honestly and gently, looking for character and movement in every frame.' },
        albums: [
          { id: uid(), title: { ru: 'Портреты', en: 'Portraits' }, previewId: photos[0].id, photos: photos.slice(0, 3) },
          { id: uid(), title: { ru: 'Свадьбы', en: 'Weddings' }, previewId: photos[3].id, photos: [photos[3]] }
        ]
      },
      work: {
        cards: [{
          id: uid(),
          image: photos[1],
          title: { ru: 'Портретная съёмка', en: 'Portrait session' },
          price: { ru: 'от 15 000 ₽', en: 'from 15,000 RUB' },
          features: {
            ru: ['Два часа съёмки', 'Помощь с образом', 'Готовая онлайн-галерея'],
            en: ['Two-hour session', 'Styling guidance', 'Finished online gallery']
          }
        }],
        stages: [
          { id: uid(), title: { ru: 'Заявка', en: 'Request' }, text: { ru: 'Обсуждаем идею и дату', en: 'We discuss the idea and date' } },
          { id: uid(), title: { ru: 'Подготовка', en: 'Preparation' }, text: { ru: 'Собираем образы и референсы', en: 'We prepare looks and references' } },
          { id: uid(), title: { ru: 'Съёмка', en: 'The shoot' }, text: { ru: 'Работаем спокойно и без спешки', en: 'We work calmly and without rush' } },
          { id: uid(), title: { ru: 'Результат', en: 'Result' }, text: { ru: 'Получаете готовую галерею', en: 'You receive the finished gallery' } }
        ]
      },
      contacts: [
        { id: uid(), type: 'telegram', label: 'Telegram', value: '@alisamiterova', href: 'https://t.me/alisamiterova' },
        { id: uid(), type: 'instagram', label: 'Instagram', value: '@alisamiterova', href: 'https://instagram.com/alisamiterova' }
      ]
    };
  }

  function normalize(c) {
    var base = emptyContent();
    c = c || {};
    if (c.loader) base.loader = Object.assign(base.loader, c.loader);
    if (base.loader.title && base.loader.title.ru === 'Алиса Митерова' && base.loader.title.en === 'Alisa Miterova') base.loader.title = null;
    if (base.loader.subtitle && base.loader.subtitle.ru === 'Фотограф · Москва' && base.loader.subtitle.en === 'Photographer · Moscow') base.loader.subtitle = null;
    /* поля всегда показывают реальный текст сайта — его можно стереть и написать свой */
    var nl = { title: clone(NATIVE_LOADER.title), subtitle: clone(NATIVE_LOADER.sub1), subtitle2: clone(NATIVE_LOADER.sub2), subtitleM: clone(NATIVE_LOADER.sub1) };
    ['title', 'subtitle', 'subtitle2', 'subtitleM'].forEach(function (k) {
      var v = base.loader[k];
      if (!v || (!String(v.ru || '').trim() && !String(v.en || '').trim())) base.loader[k] = nl[k];
    });
    if (c.home) {
      ['desktop', 'tablet', 'mobile'].forEach(function (mode) {
        base.home[mode] = Object.assign(base.home[mode], c.home[mode] || {});
      });
      if (c.home.texts) base.home.texts = Object.assign(base.home.texts, c.home.texts);
    }
    base.home.photo = { L: null, R: null };
    ['L', 'R'].forEach(function (side) {
      base.home.photo[side] = (c.home && c.home.photo && c.home.photo[side]) || base.home.desktop[side] || base.home.tablet[side] || base.home.mobile[side] || null;
    });
    base.home.pos = { desktop: {}, tablet: {}, mobile: {} };
    ['desktop', 'tablet', 'mobile'].forEach(function (mode) {
      ['L', 'R'].forEach(function (side) {
        var p = c.home && c.home.pos && c.home.pos[mode] && c.home.pos[mode][side];
        base.home.pos[mode][side] = (p && isFinite(p.x) && isFinite(p.y)) ? { x: Math.min(100, Math.max(0, Math.round(Number(p.x)))), y: Math.min(100, Math.max(0, Math.round(Number(p.y)))) } : { x: 50, y: 50 };
      });
    });
    ['desktop', 'tablet', 'mobile'].forEach(function (mode) { base.home[mode] = { L: base.home.photo.L, R: base.home.photo.R }; });
    Object.keys(NATIVE_HOME).forEach(function (k) {
      var v = base.home.texts[k];
      if (!v || (!String(v.ru || '').trim() && !String(v.en || '').trim())) base.home.texts[k] = clone(NATIVE_HOME[k]);
    });
    if (c.portfolio) base.portfolio = Object.assign(base.portfolio, c.portfolio);
    if (c.work) base.work = Object.assign(base.work, c.work);
    if (Array.isArray(c.contacts)) base.contacts = c.contacts;
    if (Array.isArray(c.faq)) base.faq = c.faq;
    if (!base.faq.length) base.faq = clone(NATIVE_FAQ);
    base.faq = base.faq.map(function (f) { return { id: f.id || uid(), q: f.q || { ru: '', en: '' }, a: f.a || { ru: '', en: '' } }; });
    var defC = [
      { type: 'telegram', value: '@vpsxm', href: 'https://t.me/vpsxm' },
      { type: 'instagram', value: '@alisamiterova', href: 'https://instagram.com/alisamiterova' },
      { type: 'max', value: 'max.ru', href: 'https://max.ru' },
      { type: 'phone', value: '+7 000 000-00-00', href: 'tel:+70000000000' }
    ];
    base.contacts = defC.map(function (d) {
      var found = null;
      (base.contacts || []).forEach(function (x) { if (x && x.type === d.type && !found) found = x; });
      var value = found && found.value ? found.value : d.value;
      var href = found && found.href ? found.href : d.href;
      var auto = contactAuto(d.type, d.type === 'phone' ? value : href);
      return { id: (found && found.id) || uid(), type: d.type, label: auto.l, value: auto.s || value, href: auto.h || href };
    });
    if (!base.portfolio.albums) base.portfolio.albums = [];
    if (!base.portfolio.intro) base.portfolio.intro = clone(NATIVE_PF.intro);
    ['ru', 'en'].forEach(function (lang) {
      if (!String(base.portfolio.intro[lang] || '').trim()) base.portfolio.intro[lang] = NATIVE_PF.intro[lang];
    });
    if (!base.portfolio.aboutBlock) base.portfolio.aboutBlock = clone(NATIVE_PF.aboutBlock);
    ['title', 'name', 'text'].forEach(function (key) {
      if (!base.portfolio.aboutBlock[key]) base.portfolio.aboutBlock[key] = clone(NATIVE_PF.aboutBlock[key]);
      ['ru', 'en'].forEach(function (lang) {
        if (!String(base.portfolio.aboutBlock[key][lang] || '').trim()) base.portfolio.aboutBlock[key][lang] = NATIVE_PF.aboutBlock[key][lang];
      });
    });
    base.portfolio.albums = base.portfolio.albums.map(function (album) {
      return {
        id: album.id || uid(),
        title: album.title || { ru: '', en: '' },
        desc: album.desc || { ru: '', en: '' },
        previewId: album.previewId || '',
        photos: Array.isArray(album.photos) ? album.photos : []
      };
    });
    if (!base.portfolio.albums.length) {
      base.portfolio.albums = clone(NATIVE_ALBUMS).map(function (album) {
        return { id: uid(), title: album.title, desc: album.desc, previewId: '', photos: [] };
      });
    }
    if (!Array.isArray(base.portfolio.aboutBlock.stages) || !base.portfolio.aboutBlock.stages.length) {
      base.portfolio.aboutBlock.stages = clone(NATIVE_PF_STAGES).map(function (stage) {
        return { id: uid(), icon: stage.icon, iconImage: null, title: stage.title, text: stage.text };
      });
    } else {
      base.portfolio.aboutBlock.stages = base.portfolio.aboutBlock.stages.map(function (stage) {
        return {
          id: stage.id || uid(),
          icon: stage.icon || 'camera',
          iconImage: stage.iconImage || null,
          title: stage.title || { ru: '', en: '' },
          text: stage.text || { ru: '', en: '' }
        };
      });
    }
    if (!base.work.cards) base.work.cards = [];
    if (!base.work.stagesHead) base.work.stagesHead = {};
    if (!base.work.stagesHead.title) base.work.stagesHead.title = { ru: 'Этапы съемки', en: 'Shooting Stages' };
    if (!base.work.stagesHead.sub) base.work.stagesHead.sub = { ru: 'От заявки до готовых кадров', en: 'From request to finished photos' };
    if (!base.work.stages) base.work.stages = [];
    if (!base.work.stages.length) {
      base.work.stages = clone(NATIVE_WORK_STAGES).map(function (stage) {
        return { id: uid(), icon: stage.icon, badge: stage.badge, title: stage.title, text: stage.text };
      });
    } else {
      base.work.stages = base.work.stages.map(function (stage, i) {
        var def = NATIVE_WORK_STAGES[i] || NATIVE_WORK_STAGES[0];
        return {
          id: stage.id || uid(),
          icon: stage.icon || def.icon,
          badge: stage.badge || { ru: '\u0428\u0430\u0433 ' + (i + 1), en: 'Step ' + (i + 1) },
          title: stage.title || { ru: '', en: '' },
          text: stage.text || { ru: '', en: '' }
        };
      });
    }
    if (!base.work.cards.length) {
      base.work.cards = clone(NATIVE_WORK_CARDS).map(function (card) {
        return { id: uid(), image: null, title: card.title, price: card.price, features: card.features };
      });
    }
    base.work.cards = base.work.cards.map(function (card) {
      var oldSteps = Array.isArray(card.steps) ? card.steps : [];
      var oldDescription = card.description || {};
      return {
        id: card.id || uid(),
        image: card.image || null,
        title: card.title || { ru: '', en: '' },
        price: (function (p) { var v = typeof p === 'string' ? { ru: p, en: p } : (p || { ru: '', en: '' }); return { ru: v.ru || '', en: rubEn(v.en || '') }; })(card.price),
        features: card.features || {
          ru: oldSteps.length ? oldSteps.map(function (step) { return [step.title, step.text].filter(Boolean).join(' — '); }) : (oldDescription.ru ? [oldDescription.ru] : []),
          en: oldSteps.length ? oldSteps.map(function (step) { return [step.title, step.text].filter(Boolean).join(' — '); }) : (oldDescription.en ? [oldDescription.en] : [])
        }
      };
    });
    if (!base.loader.images) base.loader.images = [];
    /* Мягкая миграция из предыдущей версии CMS: ничего введённое раньше не теряется. */
    if (!c.loader && c.rsub) {
      base.loader.subtitle.ru = c.rsub.ru && c.rsub.ru[0] || base.loader.subtitle.ru;
      base.loader.subtitle.en = c.rsub.en && c.rsub.en[0] || base.loader.subtitle.en;
    }
    if (!c.home && c.covers) {
      ['L', 'R'].forEach(function (side) {
        if (c.covers[side] && c.covers[side].url) base.home.desktop[side] = { id: uid(), url: c.covers[side].url, name: '' };
      });
    }
    if (!c.portfolio && c.secs && c.secs.pf && Array.isArray(c.secs.pf.items)) {
      base.portfolio.albums = c.secs.pf.items.map(function (item) {
        return { id: uid(), title: { ru: item[0] || '', en: item[1] || '' }, previewId: '', photos: [] };
      });
    }
    if (!c.portfolio && Array.isArray(c.gallery) && c.gallery.length) {
      var photos = c.gallery.map(function (item) { return { id: uid(), url: item.url, name: '' }; }).filter(function (item) { return item.url; });
      if (!base.portfolio.albums.length) base.portfolio.albums.push({ id: uid(), title: { ru: 'Галерея', en: 'Gallery' }, previewId: '', photos: [] });
      base.portfolio.albums[0].photos = photos;
      base.portfolio.albums[0].previewId = photos[0] ? photos[0].id : '';
    }
    if (!c.work && c.secs && c.secs.wk && Array.isArray(c.secs.wk.items)) {
      base.work.cards = c.secs.wk.items.map(function (item) {
        return {
          id: uid(),
          image: null,
          title: { ru: item[0] || '', en: item[1] || '' },
          price: { ru: item[2] || '', en: rubEn(item[3] || item[2] || '') },
          features: { ru: item[4] || [], en: item[5] || [] }
        };
      });
    }
    if (!c.admin && !c.loader && Array.isArray(c.contacts) && c.contacts.length) {
      base.contacts = c.contacts.map(function (item) {
        var type = { tg: 'telegram', ig: 'instagram', mx: 'max', ph: 'phone' }[item.icon] || 'website';
        return { id: uid(), type: type, label: item.l || typeName(type), value: item.s || '', href: item.h || '' };
      });
    }
    return base;
  }

  function api(path, options) {
    options = options || {};
    options.credentials = 'same-origin';
    options.headers = options.headers || {};
    if (csrf) options.headers['X-CSRF'] = csrf;
    if (options.json !== undefined) {
      options.body = JSON.stringify(options.json);
      options.headers['Content-Type'] = 'application/json';
      delete options.json;
    }
    if (options.raw !== undefined) {
      options.body = options.raw;
      options.headers['Content-Type'] = options.rawType || 'application/octet-stream';
      if (options.rawName) options.headers['X-File-Name'] = encodeURIComponent(options.rawName);
      if (options.rawReady) options.headers['X-Ready'] = '1';
      delete options.raw; delete options.rawType; delete options.rawName; delete options.rawReady;
    }
    return fetch(API + path, options).catch(function () {
      throw new Error('Запрос оборвался — файл слишком тяжёлый либо связь нестабильна.');
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (json) {
        if (!response.ok) {
          var error = new Error(json.error || 'Не удалось выполнить действие');
          error.status = response.status;
          throw error;
        }
        return json;
      });
    });
  }

  function toast(message) {
    var el = $('#toast');
    el.textContent = message;
    el.classList.add('is-visible');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { el.classList.remove('is-visible'); }, 2600);
  }

  function setDirty(section) {
    dirtySections[section || active] = true;
    if (baseJson && JSON.stringify(draft) === baseJson) { clearDirty(); return; }
    $('#draftState').textContent = 'Есть неопубликованные изменения';
    $('#draftState').classList.add('changed');
    renderNav();
    syncMobileFlags();
  }

  function clearDirty() {
    dirtySections = {};
    $('#draftState').textContent = 'Все изменения сохранены';
    $('#draftState').classList.remove('changed');
    renderNav();
    syncMobileFlags();
  }

  function renderNav() {
    $('#mainNav').innerHTML = sections.map(function (s) {
      return '<button type="button" data-section="' + s.id + '" class="' + (active === s.id ? 'is-active ' : '') + (dirtySections[s.id] ? 'has-change' : '') + '">' +
        '<span class="nav-index">' + s.index + '</span><span class="nav-label">' + s.label + '</span><span class="nav-dot"></span></button>';
    }).join('');
    $$('[data-section]', $('#mainNav')).forEach(function (button) {
      button.onclick = function () {
        active = button.getAttribute('data-section');
        document.body.classList.remove('menu-open');
        $('#menuToggle').setAttribute('aria-expanded', 'false');
        render();
      };
    });
  }

  function render() {
    var meta = sections.filter(function (s) { return s.id === active; })[0];
    $('#sectionKicker').textContent = meta.index + ' / 05';
    $('#sectionTitle').textContent = meta.title;
    $('#sectionNote').textContent = meta.note;
    renderNav();
    if (active === 'loader') renderLoader();
    if (active === 'home') renderHome();
    if (active === 'portfolio') renderPortfolio();
    if (active === 'work') renderWork();
    if (active === 'contacts') renderContacts();
  }

  function field(label, value, key, kind, placeholder) {
    var tag = kind === 'textarea' ? 'textarea' : 'input';
    return '<label class="field"><span>' + label + '</span><' + tag + ' data-bind="' + key + '" placeholder="' + esc(placeholder || '') + '"' +
      (tag === 'input' ? ' value="' + esc(value) + '"' : '') + '>' + (tag === 'textarea' ? esc(value) : '') + '</' + tag + '></label>';
  }

  function bindFields(root, object) {
    $$('[data-bind]', root).forEach(function (input) {
      input.oninput = function () {
        var path = input.getAttribute('data-bind').split('.');
        var target = object;
        for (var i = 0; i < path.length - 1; i++) target = target[path[i]];
        target[path[path.length - 1]] = input.value;
        setDirty();
      };
      if (input.tagName === 'TEXTAREA') {
        var fit = function () { input.style.height = 'auto'; input.style.height = (input.scrollHeight + 4) + 'px'; };
        requestAnimationFrame(fit);
        input.addEventListener('input', fit);
      }
    });
  }

  function fmtSize(n) {
    n = Number(n) || 0;
    if (!n) return '';
    if (n < 1048576) return Math.max(1, Math.round(n / 1024)) + ' КБ';
    if (n < 1073741824) return (n / 1048576).toFixed(1).replace('.', ',') + ' МБ';
    return (n / 1073741824).toFixed(2).replace('.', ',') + ' ГБ';
  }
  var sizeCache = {};
  function fillSizes(root) {
    $$('[data-lazy-size]', root).forEach(function (el) {
      var url = el.getAttribute('data-lazy-size');
      el.removeAttribute('data-lazy-size');
      var apply = function (n) { el.textContent = n ? fmtSize(n) : '—'; };
      if (sizeCache[url] !== undefined) return apply(sizeCache[url]);
      fetch(url, { method: 'HEAD' }).then(function (r) {
        var n = Number(r.headers.get('content-length')) || 0;
        sizeCache[url] = n;
        apply(n);
      }).catch(function () { apply(0); });
    });
  }
  try {
    new MutationObserver(function () { fillSizes(document); }).observe(document.getElementById('editor'), { childList: true, subtree: true });
  } catch (e) {}

  function rubEn(value) { return String(value == null ? '' : value).replace(/₽/g, 'RUB'); }

  var STORAGE_LIMIT = 10 * 1024 * 1024 * 1024;

  function usedBytes() {
    var total = 0;
    (function walk(node) {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) { node.forEach(walk); return; }
      if (typeof node.url === 'string' && typeof node.size === 'number') total += node.size;
      Object.keys(node).forEach(function (key) { walk(node[key]); });
    })(draft);
    return total;
  }

  function fmtGb(bytes) { return (bytes / (1024 * 1024 * 1024)).toFixed(2).replace('.', ',') + ' ГБ'; }

  function mediaTile(image, index, coverIndex, sortable) {
    var size = fmtSize(image.size);
    return '<article class="media-tile ' + (index === coverIndex ? 'is-cover' : '') + (sortable ? ' is-sortable' : '') + '"' + (sortable ? ' draggable="true" data-photo-idx="' + index + '"' : '') + ' title="' + esc(image.name || '') + '">' +
      '<img src="' + esc(image.url) + '" alt="' + esc(image.name || 'Загруженная фотография') + '" title="' + esc(image.name || '') + '">' +
      '<button class="tile-del" type="button" data-remove="' + index + '" title="Удалить" aria-label="Удалить">&minus;</button>' +
      '<div class="tile-meta"><span class="tile-name" title="' + esc(image.name || '') + '">' + esc(image.name || 'Без названия') + '</span>' + (size ? '<span class="tile-size">' + size + '</span>' : '<span class="tile-size" data-lazy-size="' + esc(image.url) + '">…</span>') + '</div>' +
      (sortable ? '<div class="tile-ord"><button class="move-btn" type="button" data-move="' + index + ':-1" title="Влево">\u2039</button><span>' + (index + 1) + '</span><button class="move-btn" type="button" data-move="' + index + ':1" title="Вправо">\u203a</button></div>' : '') +
      '<div class="media-actions">' +
      '<button class="media-action" type="button" data-cover="' + index + '">Превью</button>' +
      '</div></article>';
  }

  function uploadTile(label, multiple, accept, counter) {
    return '<div class="upload-tile"><button type="button" data-upload><b>＋</b>' + label +
      (counter ? '<i class="tile-count">' + esc(counter) + '</i>' : '') + '</button></div>';
  }

  function chooseFiles(options, callback) {
    var picker = $('#filePicker');
    picker.accept = options.accept || 'image/*';
    picker.multiple = !!options.multiple;
    picker.value = '';
    uploadCallback = callback;
    uploadLimit = Number(options.max) || 0;
    picker.click();
  }

  /* --- адаптивное сжатие: включается ТОЛЬКО если файл не пролезает в запрос --- */
  var WEBP_OK = (function () {
    try { return document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp') === 0; } catch (e) { return false; }
  })();
  var QSTEPS = [0.94, 0.88, 0.82, 0.74, 0.66, 0.58, 0.50];

  function fmtMB(n) { return (n / 1048576).toFixed(1).replace('.', ',') + ' МБ'; }

  function loadViaImg(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Не удалось открыть изображение')); };
      img.src = url;
    });
  }
  function loadBitmap(file) {
    if (window.createImageBitmap) {
      return createImageBitmap(file, { imageOrientation: 'from-image' }).catch(function () { return loadViaImg(file); });
    }
    return loadViaImg(file);
  }
  function encodeCanvas(canvas, type, q) {
    return new Promise(function (resolve) {
      if (canvas.toBlob) canvas.toBlob(function (b) { resolve(b); }, type, q);
      else resolve(null);
    });
  }
  /* Сначала падает только качество при ПОЛНОМ разрешении.
     Пиксели уменьшаются только если качества не хватило. */
  function shrinkTo(file, limit, onStep) {
    return loadBitmap(file).then(function (src) {
      var w0 = src.width || src.naturalWidth;
      var h0 = src.height || src.naturalHeight;
      if (!w0 || !h0) throw new Error('Не удалось прочитать размеры изображения');
      var type = WEBP_OK ? 'image/webp' : 'image/jpeg';
      var scale = 1;
      var round = 0;
      function attempt() {
        round++;
        var w = Math.max(1, Math.round(w0 * scale));
        var h = Math.max(1, Math.round(h0 * scale));
        var canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        var ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(src, 0, 0, w, h);
        var qi = 0;
        function tryQ() {
          if (qi >= QSTEPS.length) {
            if (round >= 10) return Promise.resolve(null);
            scale *= 0.82;
            return attempt();
          }
          var q = QSTEPS[qi++];
          if (onStep) onStep(w, h);
          return encodeCanvas(canvas, type, q).then(function (blob) {
            if (!blob) return null;
            if (blob.size <= limit) return { blob: blob, width: w, height: h };
            return tryQ();
          });
        }
        return tryQ();
      }
      return attempt();
    });
  }

  /* --- прямая загрузка в R2: лимита 4,5 МБ нет, сервер ничего не кодирует --- */

  /* Лёгкая версия для сайта. Разрешение сохраняется полностью:
     уменьшаем только если кадр не влезает в технический потолок формата (16383 px). */
  function makeWeb(file) {
    return loadBitmap(file).then(function (src) {
      var w0 = src.width || src.naturalWidth;
      var h0 = src.height || src.naturalHeight;
      if (!w0 || !h0) throw new Error('Не удалось прочитать размеры изображения');
      var scale = Math.min(1, 16383 / Math.max(w0, h0));
      var w = Math.max(1, Math.round(w0 * scale));
      var h = Math.max(1, Math.round(h0 * scale));
      var canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      var ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(src, 0, 0, w, h);
      var type = WEBP_OK ? 'image/webp' : 'image/jpeg';
      return encodeCanvas(canvas, type, 0.92).then(function (blob) {
        if (!blob) throw new Error('Браузер не смог подготовить веб-версию');
        return { blob: blob, width: w, height: h, type: type, ext: WEBP_OK ? 'webp' : 'jpg' };
      });
    });
  }

  function putSigned(url, blob, type, onProgress) {
    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open('PUT', url, true);
      if (type) xhr.setRequestHeader('Content-Type', type);
      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = function (e) { if (e.lengthComputable) onProgress(e.loaded, e.total); };
      }
      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error('Хранилище отклонило файл (код ' + xhr.status + ')'));
      };
      xhr.onerror = function () {
        reject(new Error('Не удалось связаться с хранилищем. Проверьте настройку CORS у бакета R2.'));
      };
      xhr.onabort = function () { reject(new Error('Загрузка прервана')); };
      xhr.send(blob);
    });
  }

  function directUpload(file, onNote) {
    var web = null;
    onNote('готовлю…');
    return makeWeb(file).then(function (out) {
      web = out;
      return api('sign-upload', {
        method: 'POST',
        json: { name: file.name, size: file.size || 0, webSize: out.blob.size, webExt: out.ext }
      });
    }).then(function (sig) {
      if (!sig || !sig.web || !sig.web.put) throw new Error('Сервер не выдал ссылку на загрузку');
      var keepOrig = !!(sig.orig && sig.orig.put);
      /* Прогресс считаем по сумме обоих файлов — они идут параллельно. */
      var totalBytes = web.blob.size + (keepOrig ? (file.size || 0) : 0);
      var doneWeb = 0, doneOrig = 0;
      function tick() {
        if (!totalBytes) return;
        var pct = Math.min(99, Math.round((doneWeb + doneOrig) / totalBytes * 100));
        onNote(pct + '%');
      }
      var jobs = [putSigned(sig.web.put, web.blob, web.type, function (l) { doneWeb = l; tick(); })];
      if (keepOrig) {
        jobs.push(putSigned(sig.orig.put, file, file.type || 'application/octet-stream', function (l) { doneOrig = l; tick(); }));
      }
      return Promise.all(jobs).then(function () {
        return { url: sig.web.url, name: sig.web.name, size: web.blob.size, width: web.width, height: web.height };
      });
    });
  }

  function uploadFiles(files, maxFiles) {
    var list = Array.prototype.slice.call(files || []);
    if (maxFiles > 0) list = list.slice(0, maxFiles);
    list = list.filter(function (file) {
      return /^image\//i.test(file.type || '') || /\.(avif|gif|heic|heif|jpe?g|png|tiff?|webp)$/i.test(file.name || '');
    });
    if (!list.length) return Promise.reject(new Error('Перетащите фотографии, а не другие файлы.'));
    var addBytes = list.reduce(function (sum, file) { return sum + (file.size || 0); }, 0);
    var usedNow = usedBytes();
    if (usedNow + addBytes > STORAGE_LIMIT) {
      return Promise.reject(new Error('Лимит 10 ГБ исчерпан (занято ' + fmtGb(usedNow) + '). Удалите часть фотографий и попробуйте снова.'));
    }
    var results = [];
    var total = list.length;
    var savedTiles = null;
    function busyTiles(text) {
      if (!savedTiles) { savedTiles = []; $$('.upload-tile button, [data-home-upload], [data-work-image]').forEach(function (b) { savedTiles.push([b, b.innerHTML]); b.disabled = true; }); }
      savedTiles.forEach(function (pair) { pair[0].innerHTML = '<b class="tile-spin">◌</b>' + text; });
    }
    function unbusyTiles() {
      if (savedTiles) savedTiles.forEach(function (pair) { pair[0].innerHTML = pair[1]; pair[0].disabled = false; });
      savedTiles = null;
    }
    var chain = Promise.resolve();
    list.forEach(function (file, fi) {
      chain = chain.then(function () {
        var lim = Number(LIMITS.maxUpload) || 4 * 1024 * 1024;
        toast('Загружаю «' + file.name + '» — ' + (fi + 1) + ' из ' + total);
        if (localPreview) {
          busyTiles('Читаю ' + (fi + 1) + ' из ' + total + '…');
          return new Promise(function (resolve, reject) {
            var reader = new FileReader();
            reader.onload = function () { resolve({ url: String(reader.result), name: file.name, size: file.size }); };
            reader.onerror = function () { reject(new Error('Не удалось прочитать файл')); };
            reader.readAsDataURL(file);
          });
        }
        /* Главный путь: файл летит в R2 напрямую. Ограничений по размеру нет. */
        if (LIMITS.direct) {
          busyTiles('Готовлю ' + (fi + 1) + ' из ' + total + '…');
          return directUpload(file, function (note) {
            busyTiles('Загружаю ' + (fi + 1) + ' из ' + total + ' — ' + note);
          });
        }

        function postBlob(blob) {
          return api('upload', {
            method: 'POST',
            raw: blob,
            rawType: blob.type || file.type || 'application/octet-stream',
            rawName: file.name
          });
        }
        /* Лёгкую веб-версию готовит браузер: разрешение кадра остаётся полным,
           а вес падает в разы — поэтому потолок сервера больше не мешает.
           Такой файл сервер уже не перекодирует, значит загрузка идёт быстро. */
        busyTiles('Готовлю ' + (fi + 1) + ' из ' + total + '…');
        return makeWeb(file).then(function (web) {
          return (web && web.blob && web.blob.size <= lim) ? web : null;
        }, function () { return null; }).then(function (web) {
          if (web) {
            toast('Подготовил ' + web.width + '×' + web.height + ', ' + fmtMB(web.blob.size) + ' — загружаю');
            busyTiles('Загружаю ' + (fi + 1) + ' из ' + total + '…');
            return api('upload', {
              method: 'POST',
              raw: web.blob,
              rawType: web.type,
              rawName: file.name,
              rawReady: true
            });
          }
          /* Запасной путь: браузер не осилил кадр — отдаём файл серверу по-старому. */
          if (file.size <= lim) {
            busyTiles('Конвертирую и загружаю ' + (fi + 1) + ' из ' + total + '…');
            return postBlob(file);
          }
          toast('Файл ' + fmtMB(file.size) + ', сервер принимает до ' + fmtMB(lim) + '. Подбираю сжатие…');
          busyTiles('Сжимаю ' + (fi + 1) + ' из ' + total + '…');
          return shrinkTo(file, lim, function (w, h) {
            busyTiles('Сжимаю ' + (fi + 1) + ' из ' + total + ' — ' + w + '×' + h + '…');
          }).then(function (out) {
            if (!out) throw new Error('Не удалось ужать «' + file.name + '» до ' + fmtMB(lim) + '. Сохраните версию полегче.');
            toast('Ужал до ' + out.width + '×' + out.height + ', ' + fmtMB(out.blob.size) + ' — иначе сервер не пропустит');
            busyTiles('Конвертирую и загружаю ' + (fi + 1) + ' из ' + total + '…');
            return postBlob(out.blob);
          });
        });
      }).then(function (result) {
        results.push({ id: uid(), url: result.url, name: file.name, size: result.size || file.size || 0 });
      });
    });
    return chain.then(function () { unbusyTiles(); return results; }, function (e) { unbusyTiles(); throw e; });
  }

  function bindDropZone(element, onImages, maxFiles) {
    if (!element) return;
    ['dragenter', 'dragover'].forEach(function (eventName) {
      element.addEventListener(eventName, function (event) {
        event.preventDefault();
        event.stopPropagation();
        if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
        element.classList.add('is-dragging');
      });
    });
    ['dragleave', 'dragend'].forEach(function (eventName) {
      element.addEventListener(eventName, function (event) {
        event.preventDefault();
        element.classList.remove('is-dragging');
      });
    });
    element.addEventListener('drop', function (event) {
      event.preventDefault();
      event.stopPropagation();
      element.classList.remove('is-dragging');
      var files = event.dataTransfer && event.dataTransfer.files;
      if (!files || !files.length) return;
      if (maxFiles === 0) return toast('В одном альбоме может быть до 80 фотографий.');
      uploadFiles(files, maxFiles).then(onImages).then(function () {
        toast(files.length > 1 ? 'Фотографии добавлены' : 'Фотография добавлена');
      }).catch(function (error) { toast(error.message); });
    });
  }

  function richField(label, lang) {
    return '<label class="field"><span>' + label + '</span><textarea class="field-rich" data-rich="' + lang + '" rows="2" spellcheck="false"></textarea></label>';
  }

  function initRichFields(root, data) {
    $$('.field-rich', root).forEach(function (el) {
      var key = el.getAttribute('data-rich').split('.');
      var kind = key[0];
      var lang = key[1];
      var read = function () {
        if (kind === 'phone') return data.subtitleM[lang] || '';
        var value = data.subtitle[lang] || '';
        if ((data.subtitle2[lang] || '').trim()) value += '\n' + data.subtitle2[lang];
        return value;
      };
      var commit = function (value) {
        value = String(value).replace(/\r/g, '');
        if (kind === 'phone') {
          data.subtitleM[lang] = value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean).join('\n');
        } else {
          var parts = value.split('\n');
          data.subtitle[lang] = parts[0].trim();
          data.subtitle2[lang] = parts.slice(1).join(' ').trim();
        }
        setDirty();
      };
      var fit = function () { el.style.height = 'auto'; el.style.height = Math.max(el.scrollHeight + 2, 56) + 'px'; };
      el.value = read();
      el.addEventListener('input', function () { commit(el.value); fit(); });
      setTimeout(fit, 0);
    });
  }

  function enableReorder(grid, list, done) {
    if (!grid) return;
    $$('.media-tile', grid).forEach(function (tile, i) {
      tile.setAttribute('draggable', 'true');
      tile.dataset.index = i;
    });
    var dragEl = null;
    grid.addEventListener('dragstart', function (event) {
      var tile = event.target.closest ? event.target.closest('.media-tile') : null;
      if (!tile) return;
      dragEl = tile;
      tile.classList.add('is-drag');
      event.dataTransfer.effectAllowed = 'move';
      try { event.dataTransfer.setData('text/plain', 'reorder'); } catch (e) {}
    });
    grid.addEventListener('dragover', function (event) {
      if (!dragEl) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      var tile = event.target.closest ? event.target.closest('.media-tile') : null;
      if (!tile || tile === dragEl) return;
      var rect = tile.getBoundingClientRect();
      var before = (event.clientX - rect.left) < rect.width / 2;
      grid.insertBefore(dragEl, before ? tile : tile.nextSibling);
    });
    grid.addEventListener('drop', function (event) { if (dragEl) event.preventDefault(); });
    grid.addEventListener('dragend', function () {
      if (!dragEl) return;
      dragEl.classList.remove('is-drag');
      dragEl = null;
      var order = $$('.media-tile', grid).map(function (tile) { return Number(tile.dataset.index); });
      var changed = order.some(function (v, i) { return v !== i; });
      if (!changed) return;
      var next = order.map(function (i) { return list[i]; });
      list.splice.apply(list, [0, list.length].concat(next));
      done();
    });
  }

  function loaderPlate(kind, lang) {
    var langLabel = lang === 'ru' ? 'Русский' : 'English';
    var kindLabel = kind === 'phone' ? 'Телефон' : 'Компьютер';
    return '<article class="cover-plate loader-plate' + (kind === 'phone' ? ' is-phone' : '') + '" data-plang="' + lang + '">' +
      '<div class="plate-head"><b>' + kindLabel + '</b><span>' + langLabel + '</span></div>' +
      '<div class="plate-body">' +
      '<div class="ce ce-loadtitle" data-lce="title.' + lang + '" spellcheck="false"></div>' +
      '<div class="ce ce-loadsub" data-lce="' + kind + '.' + lang + '" spellcheck="false"></div>' +
      '</div></article>';
  }

  function bindLoaderPlates(root, data) {
    $$('[data-lce]', root).forEach(function (el) {
      var key = el.getAttribute('data-lce').split('.');
      var kind = key[0];
      var lang = key[1];
      var read = function () {
        if (kind === 'title') return data.title[lang] || '';
        if (kind === 'phone') return data.subtitleM[lang] || '';
        var value = data.subtitle[lang] || '';
        if ((data.subtitle2[lang] || '').trim()) value += '\n' + data.subtitle2[lang];
        return value;
      };
      var commit = function (value) {
        value = String(value).replace(/\r/g, '');
        if (kind === 'title') data.title[lang] = value.replace(/\s+/g, ' ').trim();
        else if (kind === 'phone') data.subtitleM[lang] = value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean).join('\n');
        else {
          var parts = value.split('\n');
          data.subtitle[lang] = parts[0].trim();
          data.subtitle2[lang] = parts.slice(1).join(' ').trim();
        }
        setDirty();
      };
      el.setAttribute('contenteditable', 'true');
      el.setAttribute('role', 'textbox');
      el.innerHTML = esc(read()).replace(/\n/g, '<br>');
      el.addEventListener('paste', function (event) {
        event.preventDefault();
        var text = (event.clipboardData || window.clipboardData).getData('text');
        document.execCommand('insertText', false, String(text));
      });
      el.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
          event.preventDefault();
          if (kind === 'title') { el.blur(); return; }
          document.execCommand('insertLineBreak');
        }
      });
      el.addEventListener('input', function () { commit(el.innerText); });
    });
  }

  function renderLoader() {
    var data = draft.loader;
    var editor = $('#editor');
    editor.innerHTML =
      '<div class="panel"><div class="panel-head"><div><h2>Текст на входе</h2><p>Заголовок автоматически отображается прописными буквами. Для переноса строки в подзаголовке используйте клавишу Enter.</p></div></div>' +
      '<div class="cover-grid is-loader">' + loaderPlate('main', 'ru') + loaderPlate('main', 'en') + '</div>' +
      '<div class="cover-grid is-phones">' + loaderPlate('phone', 'ru') + loaderPlate('phone', 'en') + '</div></div>' +
      '<div class="panel"><div class="panel-head"><div><h2>Фотографии в центре</h2><p>Фотографии отображаются в небольшом квадрате по центру экрана. Изображение автоматически обрезается по центру, поэтому подойдёт любой формат кадра. Можно загрузить от 1 до 4 фотографий. На сайте они отображаются в чёрно-белом цвете — это особенность лоадера и не влияет на оригиналы. Порядок фотографий можно изменить в любой момент, просто перетащив их мышью.</p></div></div>' +
      '<div class="upload-grid">' + data.images.map(function (image, index) { return mediaTile(image, index, -1); }).join('') +
      (data.images.length >= 4 ? '<div class="upload-tile is-full"><span><b>4 / 4</b>Достигнуто максимальное количество фотографий</span></div>' : uploadTile('Добавить фотографии', true, null, data.images.length + ' / 4')) + '</div></div>';
    bindFields(editor, data);
    bindLoaderPlates(editor, data);
    enableReorder($('.upload-grid', editor), data.images, function () { renderLoader(); setDirty(); });
    var uploadBtn = $('[data-upload]', editor);
    if (uploadBtn) uploadBtn.onclick = function () {
      chooseFiles({ multiple: true }, function (images) {
        data.images = data.images.concat(images).slice(0, 4);
        setDirty(); renderLoader();
      });
    };
    $$('[data-cover]', editor).forEach(function (b) { b.remove(); });
    $$('[data-remove]', editor).forEach(function (button) {
      button.onclick = function () { var image = data.images[Number(button.dataset.remove)]; if (needConfirm('home-photo-' + button.dataset.remove, { eyebrow: 'Удаление', title: 'Удалить фотографию?', text: '«' + ((image && image.name) || 'Без названия') + '» будет убрана из раздела.', ok: 'Удалить', danger: true }, function () { button.onclick(); })) return; data.images.splice(Number(button.dataset.remove), 1); setDirty(); renderLoader(); };
    });
  }

  var NATIVE_COVERS = { L: '', R: '' };
  var nativeCoversLoading = false;
  function loadNativeCovers() {
    if ((NATIVE_COVERS.L && NATIVE_COVERS.R) || nativeCoversLoading) return;
    nativeCoversLoading = true;
    fetch('/', { credentials: 'omit' }).then(function (r) { return r.text(); }).then(function (html) {
      var re = /class="cimg" style="background-image:url\('([^']+)'\)/g;
      var m1 = re.exec(html);
      var m2 = re.exec(html);
      if (m1) NATIVE_COVERS.L = m1[1];
      if (m2) NATIVE_COVERS.R = m2[1];
      nativeCoversLoading = false;
      if (active === 'home') renderHome();
    }).catch(function () { nativeCoversLoading = false; });
  }

  function syncHomePairs() {
    ['desktop', 'tablet', 'mobile'].forEach(function (mode) {
      draft.home[mode] = { L: draft.home.photo.L, R: draft.home.photo.R };
    });
  }

  function ceBox(label, value, key) {
    return '<div class="ce ce-' + label + '" data-ce="' + key + '" spellcheck="false">' + esc(value || '') + '</div>';
  }

  function bindEditable(root, object) {
    $$('[data-ce]', root).forEach(function (el) {
      el.setAttribute('contenteditable', 'true');
      el.setAttribute('role', 'textbox');
      el.addEventListener('paste', function (event) {
        event.preventDefault();
        var text = (event.clipboardData || window.clipboardData).getData('text');
        document.execCommand('insertText', false, String(text).replace(/\s+/g, ' '));
      });
      el.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') { event.preventDefault(); el.blur(); }
      });
      el.addEventListener('input', function () {
        var path = el.getAttribute('data-ce').split('.');
        var target = object;
        for (var i = 0; i < path.length - 1; i++) target = target[path[i]];
        target[path[path.length - 1]] = el.textContent.replace(/\s+/g, ' ').replace(/^ | $/g, '');
        setDirty();
      });
    });
  }

  function coverPlate(side, lang, data) {
    var t = data.texts;
    var langLabel = lang === 'ru' ? 'Русский' : 'English';
    var head = '<div class="plate-head"><b>' + (side === 'L' ? 'Portfolio' : 'Work') + '</b><span>' + langLabel + '</span></div>';
    if (side === 'L') {
      return '<article class="cover-plate" data-plang="' + lang + '">' + head +
        '<div class="plate-body">' +
        ceBox('tag', t.tagL[lang], 'texts.tagL.' + lang) +
        '<div class="plate-title">PORTFOLIO —</div>' +
        ceBox('small', t.smallL[lang], 'texts.smallL.' + lang) +
        ceBox('sub', t.subL[lang], 'texts.subL.' + lang) +
        '</div></article>';
    }
    var icons = '<div class="plate-socs" aria-hidden="true">' +
      '<span class="psoc">' + CONTACT_ICONS.telegram + '</span>' +
      '<span class="psoc"><i class="psoc-star">*</i>' + CONTACT_ICONS.instagram + '</span>' +
      '<span class="psoc">' + CONTACT_ICONS.max + '</span>' +
      '<span class="psoc">' + CONTACT_ICONS.phone + '</span></div>';
    return '<article class="cover-plate" data-plang="' + lang + '">' + head +
      '<div class="plate-body">' +
      '<div class="plate-title">WORK</div>' +
      ceBox('sub', t.subR[lang], 'texts.subR.' + lang) +
      icons +
      '<div class="plate-fixed"><span class="plate-plus">+</span>' + (lang === 'ru' ? 'СТОИМОСТЬ УСЛУГ' : 'SERVICE PRICING') + '</div>' +
      '</div></article>';
  }

  function renderHome() {
    var data = draft.home;
    var editor = $('#editor');
    var labels = { desktop: 'Широкий экран', tablet: 'Ноутбук', mobile: 'Телефон' };
    var deviceAspect = { desktop: '16 / 9', tablet: '4 / 3', mobile: '9 / 19' };
    var deviceNote = { desktop: 'две половины рядом', tablet: 'две половины рядом', mobile: 'Portfolio сверху, Work снизу' };
    editor.innerHTML =
      '<div class="panel"><div class="panel-head"><div><h2>Кадр под каждый экран</h2><p>Ниже показано, как фотографии будут выглядеть на выбранном устройстве — с теми же пропорциями, кадрированием и расположением, что и на сайте.</p></div></div>' +
      '<div class="screen-bar"><div class="screen-tabs">' + ['desktop', 'tablet', 'mobile'].map(function (mode) {
        return '<button type="button" data-screen="' + mode + '" class="' + (mode === screenMode ? 'is-active' : '') + '">' + labels[mode] + '</button>';
      }).join('') + '</div>' +
      '<div class="frame-actions"><button class="frame-chip" type="button" data-frame-reset="L">Portfolio — по центру</button>' +
      '<button class="frame-chip" type="button" data-frame-reset="R">Work — по центру</button></div></div>' +
      '<div class="device-wrap"><div class="device-mock' + (screenMode === 'mobile' ? ' is-stacked' : '') + '" style="aspect-ratio:' + deviceAspect[screenMode] + '">' +
      ['L', 'R'].map(function (side) {
        var image = data.photo[side];
        var url = image ? image.url : NATIVE_COVERS[side];
        var pos = data.pos[screenMode][side];
        return '<div class="frame-pane" data-frame="' + side + '" style="' + (url ? 'background-image:url(' + esc(url) + ');background-position:' + pos.x + '% ' + pos.y + '%;' : '') + '">' +
          '<span class="pane-tag">' + (side === 'L' ? 'PORTFOLIO' : 'WORK') + '</span>' +
          (url ? '' : '<span class="pane-empty">Сначала выберите фотографию</span>') + '</div>';
      }).join('') +
      '</div></div>' +
      '<div class="pick-row">' + ['L', 'R'].map(function (side) {
        var image = data.photo[side];
        return '<div class="pick-col">' +
          '<button class="button button-light" type="button" data-home-upload="' + side + '">Выбрать фотографию</button>' +
          (image ? '<button class="text-button" type="button" data-home-remove="' + side + '">Вернуть фото сайта</button>' : '') + '</div>';
      }).join('') + '</div>' +
      '<p class="help is-center">Потяните фотографию внутри половины экрана — так вы выбираете, какая её часть видна на этом устройстве.</p></div>' +
      '<div class="panel"><div class="panel-head"><div><h2>Заголовки и подписи</h2><p>Все изменяемые тексты доступны прямо в макете. Некоторые элементы являются частью дизайна и остаются неизменными.</p></div></div>' +
      '<div class="cover-grid">' +
      coverPlate('L', 'ru', data) + coverPlate('R', 'ru', data) +
      coverPlate('L', 'en', data) + coverPlate('R', 'en', data) +
      '</div></div>';
    $$('[data-screen]', editor).forEach(function (button) { button.onclick = function () { screenMode = button.dataset.screen; renderHome(); }; });
    $$('[data-home-upload]', editor).forEach(function (button) {
      button.onclick = function () {
        var side = button.dataset.homeUpload;
        chooseFiles({ multiple: false }, function (images) { data.photo[side] = images[0]; syncHomePairs(); setDirty(); renderHome(); });
      };
    });
    $$('[data-home-remove]', editor).forEach(function (button) {
      button.onclick = function () { data.photo[button.dataset.homeRemove] = null; syncHomePairs(); setDirty(); renderHome(); };
    });
    $$('[data-frame-reset]', editor).forEach(function (button) {
      button.onclick = function () { data.pos[screenMode][button.dataset.frameReset] = { x: 50, y: 50 }; setDirty(); renderHome(); };
    });
    bindEditable(editor, data);
    $$('.frame-pane', editor).forEach(function (box) {
      var side = box.dataset.frame;
      var start = null;
      var onMove = function (event) {
        if (!start) return;
        var point = event.touches ? event.touches[0] : event;
        var rect = box.getBoundingClientRect();
        var pos = data.pos[screenMode][side];
        pos.x = Math.min(100, Math.max(0, Math.round(start.px - ((point.clientX - start.x) / rect.width) * 100)));
        pos.y = Math.min(100, Math.max(0, Math.round(start.py - ((point.clientY - start.y) / rect.height) * 100)));
        box.style.backgroundPosition = pos.x + '% ' + pos.y + '%';
        event.preventDefault();
      };
      var onUp = function () {
        if (start) { start = null; setDirty(); }
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onUp);
      };
      var onDown = function (event) {
        if (!(data.photo[side] || NATIVE_COVERS[side])) return;
        var point = event.touches ? event.touches[0] : event;
        var pos = data.pos[screenMode][side];
        start = { x: point.clientX, y: point.clientY, px: pos.x, py: pos.y };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onUp);
        event.preventDefault();
      };
      box.addEventListener('mousedown', onDown);
      box.addEventListener('touchstart', onDown, { passive: false });
    });
    bindFields(editor, data);
    loadNativeCovers();
  }

  var AUTO_TR_KEY = 'cmsAutoTr';
  var trTimers = new WeakMap();
  var ceReg = [];
  function autoTrOn() { try { return localStorage.getItem(AUTO_TR_KEY) === '1'; } catch (e) { return false; } }
  function setAutoTr(on) { try { localStorage.setItem(AUTO_TR_KEY, on ? '1' : '0'); } catch (e) {} syncAutoTrUi(); }
  function syncAutoTrUi() {
    document.body.classList.toggle('tr-auto', autoTrOn());
    ['#mhTr', '#trDesk'].forEach(function (selector) {
      var flag = $(selector);
      if (!flag) return;
      flag.classList.toggle('is-on', autoTrOn());
      flag.setAttribute('aria-pressed', autoTrOn() ? 'true' : 'false');
      flag.setAttribute('title', autoTrOn() ? 'Автоперевод включён' : 'Автоперевод выключен');
      var mark = flag.querySelector('.mh-flag-mark');
      if (mark) mark.textContent = autoTrOn() ? 'ON' : '';
    });
  }

  function syncMobileFlags() {
    var dot = $('#mhDot');
    if (!dot) return;
    dot.removeAttribute('hidden');
    dot.classList.toggle('is-on', !!Object.keys(dirtySections).length);
  }
  function translateRu(text) {
    return api('translate', { method: 'POST', json: { q: String(text || '') } }).then(function (r) { return (r && r.text) || ''; });
  }
  function paintEn(target, value) {
    ceReg = ceReg.filter(function (r) { return document.contains(r.el); });
    ceReg.forEach(function (r) {
      if (r.target === target && r.last === 'en' && r.el !== document.activeElement) {
        r.el.innerHTML = esc(String(value || '')).replace(/\n/g, '<br>');
      }
    });
  }
  function queueAutoTr(target, section) {
    if (!autoTrOn() || !target || typeof target.en === 'undefined') return;
    var prev = trTimers.get(target);
    if (prev) clearTimeout(prev);
    trTimers.set(target, setTimeout(function () {
      trTimers.delete(target);
      var src = String(target.ru || '');
      if (!src.trim()) { target.en = ''; paintEn(target, ''); setDirty(section); return; }
      translateRu(src).then(function (out) {
        if (!out) return;
        target.en = out;
        paintEn(target, out);
        setDirty(section);
      }).catch(function (e) { toast((e && e.message) || 'Автоперевод недоступен'); });
    }, 900));
  }
  function translateAll() {
    var jobs = [];
    (function walk(node) {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) { node.forEach(walk); return; }
      if (typeof node.ru === 'string' && node.ru.trim() && typeof node.en !== 'undefined') jobs.push(node);
      Object.keys(node).forEach(function (k) { if (node[k] && typeof node[k] === 'object') walk(node[k]); });
    })(draft);
    var i = 0, done = 0;
    function step() {
      if (i >= jobs.length) return Promise.resolve(done);
      var node = jobs[i++];
      return translateRu(node.ru).then(function (out) {
        if (out) { node.en = out; done++; }
        return step();
      });
    }
    return step().then(function (n) { if (n) setDirty(active); return n; });
  }

  function bindPathEditable(root, object, attr, section) {
    $$('[' + attr + ']', root).forEach(function (el) {
      var path = el.getAttribute(attr).split('.');
      var multiline = el.hasAttribute('data-multiline');
      var target = object;
      for (var i = 0; i < path.length - 1; i++) {
        if (!target[path[i]] || typeof target[path[i]] !== 'object') target[path[i]] = {};
        target = target[path[i]];
      }
      var last = path[path.length - 1];
      ceReg.push({ el: el, target: target, last: last });
      var value = target[last] == null ? '' : String(target[last]);
      el.setAttribute('contenteditable', 'true');
      el.setAttribute('role', 'textbox');
      el.innerHTML = esc(value).replace(/\n/g, '<br>');
      el.addEventListener('paste', function (event) {
        event.preventDefault();
        var text = String((event.clipboardData || window.clipboardData).getData('text'));
        document.execCommand('insertText', false, multiline ? text : text.replace(/\s+/g, ' '));
      });
      el.addEventListener('keydown', function (event) {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        if (multiline) document.execCommand('insertLineBreak'); else el.blur();
      });
      el.addEventListener('input', function () {
        var next = el.innerText.replace(/\r/g, '');
        target[last] = multiline ? next : next.replace(/\s+/g, ' ').trim();
        setDirty(section);
        if (last === 'ru') queueAutoTr(target, section);
      });
    });
  }

  function sfield(label, value, key, kind, placeholder) {
    return field(label, value, key, kind, placeholder).replace('data-bind=', 'data-sbind=');
  }

  function bindSFields(root, object, section) {
    $$('[data-sbind]', root).forEach(function (input) {
      input.oninput = function () {
        var path = input.getAttribute('data-sbind').split('.');
        var target = object;
        for (var i = 0; i < path.length - 1; i++) {
          if (!target[path[i]] || typeof target[path[i]] !== 'object') target[path[i]] = {};
          target = target[path[i]];
        }
        target[path[path.length - 1]] = input.value;
        setDirty(section);
      };
      if (input.tagName === 'TEXTAREA') {
        var fit = function () { input.style.height = 'auto'; input.style.height = (input.scrollHeight + 4) + 'px'; };
        requestAnimationFrame(fit);
        input.addEventListener('input', fit);
      }
    });
  }

  function iconPicker(current) {
    return '<div class="icon-picker">' + ICON_KEYS.map(function (key) {
      return '<button type="button" class="icon-opt' + (key === current ? ' is-on' : '') + '" data-icon-key="' + key + '">' + iconMarkup(key) + '</button>';
    }).join('') + '</div>';
  }

  function bindIconPicker(root, object, section, done) {
    $$('[data-icon-key]', root).forEach(function (button) {
      button.onclick = function () {
        object.icon = button.getAttribute('data-icon-key');
        setDirty(section);
        $$('[data-icon-key]', root).forEach(function (b) { b.classList.toggle('is-on', b === button); });
        if (done) done();
      };
    });
  }

  var openAlbumId = null;
  var coverMenuId = null;

  var NATIVE_ALBUM_PHOTOS = null;
  var NATIVE_WORK_IMAGES = null;
  var nativeMediaLoading = false;

  function loadNativeMedia() {
    if (nativeMediaLoading || NATIVE_ALBUM_PHOTOS || NATIVE_WORK_IMAGES) return;
    nativeMediaLoading = true;
    fetch('/', { credentials: 'omit' }).then(function (r) { return r.text(); }).then(function (html) {
      var m = html.match(/var COLPH=(\[\[[\s\S]*?\]\]);/);
      if (m) {
        NATIVE_ALBUM_PHOTOS = m[1].split('],[').map(function (chunk) {
          return chunk.match(/https?:\/\/[^'"]+/g) || [];
        });
      }
      var w = html.match(/var WKPH=(\[[\s\S]*?\]);/);
      if (w) NATIVE_WORK_IMAGES = w[1].match(/https?:\/\/[^'"]+/g) || [];
      nativeMediaLoading = false;
      applyNativeMedia();
    }).catch(function () { nativeMediaLoading = false; });
  }

  function applyNativeMedia() {
    var changed = false;
    draft.portfolio.albums.forEach(function (album, i) {
      if (!album.desc) album.desc = { ru: '', en: '' };
      var nd = NATIVE_ALBUMS[i] && NATIVE_ALBUMS[i].desc;
      if (nd && !String(album.desc.ru || '').trim() && !String(album.desc.en || '').trim()) {
        album.desc = { ru: nd.ru, en: nd.en };
        changed = true;
      }
    });
    if (NATIVE_ALBUM_PHOTOS) {
      draft.portfolio.albums.forEach(function (album, i) {
        if (!album.photos.length && NATIVE_ALBUM_PHOTOS[i] && NATIVE_ALBUM_PHOTOS[i].length) {
          album.photos = NATIVE_ALBUM_PHOTOS[i].map(function (url) { return { id: uid(), url: url, name: '' }; });
          if (!album.previewId && album.photos[0]) album.previewId = album.photos[0].id;
          changed = true;
        }
      });
    }
    if (NATIVE_WORK_IMAGES) {
      draft.work.cards.forEach(function (card, i) {
        if (!card.image && NATIVE_WORK_IMAGES[i]) { card.image = { id: uid(), url: NATIVE_WORK_IMAGES[i], name: '' }; changed = true; }
      });
    }
    if (!changed) return;
    if (active === 'portfolio') renderPortfolio();
    if (active === 'work') renderWork();
  }

  function albumCover(album) {
    var cover = null;
    album.photos.forEach(function (photo) { if (!cover && photo.id === album.previewId) cover = photo; });
    if (!cover) cover = album.photos[0];
    return cover;
  }

  function albumTile(album, index) {
    var cover = albumCover(album);
    return '<article class="album-tile' + (openAlbumId === album.id ? ' is-open' : '') + '" data-album-tile="' + index + '" draggable="true">' +
      '<div class="tile-photo" style="' + (cover ? 'background-image:url(' + esc(cover.url) + ')' : '') + '">' +
      '<div class="tile-acts">' +
      '<span class="tile-act tile-grab" title="Перетащите, чтобы изменить порядок">☰</span>' +
      '<button class="tile-act" type="button" data-open-album="' + index + '" title="Редактировать альбом">✎</button>' +
      '<button class="tile-act is-danger" type="button" data-del-album="' + index + '" title="Удалить альбом">✕</button>' +
      '</div>' +
      '<div class="tile-cap"><b>' + esc(album.title.ru || 'Без названия') + '</b><small>' + album.photos.length + ' фото</small></div>' +
      '</div></article>';
  }

  function albumPlate(album, lang) {
    return '<article class="cover-plate site-plate" data-plang="' + lang + '">' +
      '<div class="plate-head"><b>' + (lang === 'ru' ? 'Русская версия' : 'English') + '</b><span>' + album.photos.length + ' фото</span></div>' +
      '<div class="plate-body is-album">' +
      '<div class="ce site-alb-title" data-ace="title.' + lang + '" data-multiline spellcheck="false"></div>' +
      '<span class="alb-lbl">Описание альбома</span>' +
      '<div class="ce site-alb-desc" data-ace="desc.' + lang + '" data-multiline spellcheck="false"></div>' +
      '</div></article>';
  }

  function albumEditor(album, index) {
    var coverIndex = album.photos.map(function (x) { return x.id; }).indexOf(album.previewId);
    var open = coverMenuId === album.id;
    return '<div class="album-editor" data-album="' + index + '">' +
      '<div class="cover-grid is-stack">' + albumPlate(album, 'ru') + albumPlate(album, 'en') + '</div>' +
      '<div class="divider"></div>' +
      '<button class="add-tile is-inline" type="button" data-cover-menu><span>★</span> Выбрать обложку альбома</button>' +
      (open ? ('<div class="cover-menu">' + (album.photos.length ? album.photos.map(function (photo, i) {
        return '<button class="cover-opt' + (i === (coverIndex < 0 ? 0 : coverIndex) ? ' is-on' : '') + '" type="button" data-cover="' + i + '" style="background-image:url(' + esc(photo.url) + ')"></button>';
      }).join('') : '<p class="help">Сначала загрузите фотографии.</p>') + '</div>') : '') +
      '<div class="upload-grid">' +
      album.photos.map(function (photo, i) { return mediaTile(photo, i, coverIndex < 0 ? 0 : coverIndex, true); }).join('') +
      uploadTile('Перетащить или выбрать фото', true) + '</div>' +
      '<div class="row-actions"><button class="button button-light" type="button" data-close-album>Готово</button></div>' +
      '</div>';
  }

  function pfIntroPlate(data, lang) {
    return '<article class="cover-plate site-plate is-wide" data-plang="' + lang + '">' +
      '<div class="plate-head"><b>' + (lang === 'ru' ? 'Русская версия' : 'English') + '</b><span>' + (lang === 'ru' ? 'ПОРТФОЛИО' : 'PORTFOLIO') + '</span></div>' +
      '<div class="plate-body is-intro"><div class="ce ce-pfintro" data-pce="intro.' + lang + '" data-multiline spellcheck="false"></div></div></article>';
  }

  function pfIconBox(stage, index) {
    var img = stage.iconImage;
    return '<span class="hw-ico' + (img ? ' has-img' : '') + '" data-pf-icon="' + index + '" title="Загрузить значок" style="' + (img ? 'background-image:url(' + esc(img.url) + ')' : '') + '">' + (img ? '' : iconMarkup(stage.icon || 'camera')) + '</span>';
  }

  function pfAboutBlock(data, lang) {
    var about = data.aboutBlock;
    var last = about.stages.length - 1;
    return '<article class="cover-plate site-plate" data-plang="' + lang + '">' +
      '<div class="plate-head"><b>' + (lang === 'ru' ? 'Русская версия' : 'English') + '</b><span>' + (lang === 'ru' ? 'Обо мне' : 'About me') + '</span></div>' +
      '<div class="plate-body is-about"><div class="hw-wrap">' +
      '<div class="hw-head">' +
      '<div class="ce hw-badge" data-pce="aboutBlock.title.' + lang + '" spellcheck="false"></div>' +
      '<div class="ce hw-h2" data-pce="aboutBlock.name.' + lang + '" spellcheck="false"></div>' +
      '<div class="ce hw-sub" data-pce="aboutBlock.text.' + lang + '" data-multiline spellcheck="false"></div>' +
      '</div>' +
      '<ol class="hw-list">' + about.stages.map(function (stage, i) {
        return '<li class="hw-item" data-pf-stage="' + i + '" data-lang="' + lang + '">' +
          '<div class="hw-rail">' + pfIconBox(stage, i) + (i === last ? '' : '<span class="hw-vline"></span>') + '</div>' +
          '<div class="hw-body' + (i === last ? ' hw-last' : '') + '">' +
          '<div class="ce hw-t" data-sce="title.' + lang + '" spellcheck="false"></div>' +
          '<div class="ce hw-p" data-sce="text.' + lang + '" data-multiline spellcheck="false"></div>' +
          (lang === 'ru' ? ('<div class="hw-tools">' +
            (stage.iconImage ? '<button class="text-button" type="button" data-pf-icon-clear="' + i + '">\u0412\u0435\u0440\u043d\u0443\u0442\u044c \u0441\u0442\u0430\u043d\u0434\u0430\u0440\u0442\u043d\u044b\u0439 \u0437\u043d\u0430\u0447\u043e\u043a</button>' : '') +
            '<button class="kill-btn is-item" type="button" data-delete-pf-stage="' + i + '"><span>\u2715</span> \u0423\u0434\u0430\u043b\u0438\u0442\u044c \u043f\u0443\u043d\u043a\u0442</button></div>') : '') +
          '</div></li>';
      }).join('') + '</ol>' +
      (lang === 'ru' ? '<button class="add-tile is-inline" type="button" id="addPfStage"><span>+</span> Добавить пункт</button>' : '') +
      '</div></div></article>';
  }

  function renderPortfolio() {
    var data = draft.portfolio;
    var editor = $('#editor');
    var openIndex = -1;
    data.albums.forEach(function (album, i) { if (album.id === openAlbumId) openIndex = i; });
    editor.innerHTML =
      '<div class="panel"><div class="panel-head"><div><h2>Строка над альбомами</h2><p>Текст отображается над альбомами и помогает кратко представить ваше портфолио.</p></div></div>' +
      '<div class="cover-grid is-stack">' + pfIntroPlate(data, 'ru') + pfIntroPlate(data, 'en') + '</div></div>' +
      '<div class="panel"><div class="panel-head"><div><h2>Альбомы</h2><p>Управляйте альбомами в том виде, в котором их увидят посетители. Перетаскивайте карточки, чтобы изменить порядок.</p></div></div>' +
      '<div class="album-grid">' + data.albums.map(albumTile).join('') + '</div>' +
      '<button class="add-tile is-inline is-strip" type="button" id="addAlbum"><span>+</span> Добавить альбом</button>' +
      (openIndex >= 0 ? albumEditor(data.albums[openIndex], openIndex) : '') + '</div>' +
      '<div class="panel"><div class="panel-head"><div><h2>Блок «Обо мне»</h2><p>Редактируйте содержимое блока сразу в макете. Для каждого пункта можно загрузить собственную иконку.</p></div></div>' +
      '<div class="cover-grid is-column">' + pfAboutBlock(data, 'ru') + pfAboutBlock(data, 'en') + '</div></div>';
    bindPathEditable(editor, data, 'data-pce', 'portfolio');
    $('#addAlbum').onclick = function () {
      var album = { id: uid(), title: { ru: 'Новый альбом', en: 'New album' }, desc: { ru: '', en: '' }, previewId: '', photos: [] };
      data.albums.push(album);
      openAlbumId = album.id;
      setDirty('portfolio'); renderPortfolio();
    };
    var addStage = $('#addPfStage');
    if (addStage) addStage.onclick = function () {
      data.aboutBlock.stages.push({ id: uid(), icon: 'camera', iconImage: null, title: { ru: 'Новый пункт', en: 'New point' }, text: { ru: 'Описание пункта', en: 'Description' } });
      setDirty('portfolio'); renderPortfolio();
    };
    $$('[data-pf-stage]', editor).forEach(function (row) {
      var stage = data.aboutBlock.stages[Number(row.dataset.pfStage)];
      bindPathEditable(row, stage, 'data-sce', 'portfolio');
    });
    var pickIcon = function (index) {
      chooseFiles({ multiple: false }, function (images) {
        data.aboutBlock.stages[index].iconImage = images[0];
        setDirty('portfolio'); renderPortfolio();
      });
    };
    $$('[data-pf-icon]', editor).forEach(function (box) { box.onclick = function () { pickIcon(Number(box.dataset.pfIcon)); }; });
    $$('[data-pf-icon-pick]', editor).forEach(function (button) { button.onclick = function () { pickIcon(Number(button.dataset.pfIconPick)); }; });
    $$('[data-pf-icon-clear]', editor).forEach(function (button) {
      button.onclick = function () { data.aboutBlock.stages[Number(button.dataset.pfIconClear)].iconImage = null; setDirty('portfolio'); renderPortfolio(); };
    });
    $$('[data-delete-pf-stage]', editor).forEach(function (button) {
      button.onclick = function () {
        var i = Number(button.dataset.deletePfStage);
        if (needConfirm('pf-stage-' + i, { eyebrow: 'Удаление', title: 'Удалить пункт?', text: 'Пункт «' + (data.aboutBlock.stages[i].title.ru || 'Без названия') + '» исчезнет из блока «Обо мне».', ok: 'Удалить', danger: true }, function () { button.onclick(); })) return;
        data.aboutBlock.stages.splice(i, 1); setDirty('portfolio'); renderPortfolio();
      };
    });
    bindAlbumTiles();
    if (openIndex >= 0) bindAlbumEditor();
    loadNativeMedia();
  }

  function bindAlbumTiles() {
    var editor = $('#editor');
    var grid = $('.album-grid', editor);
    var albums = draft.portfolio.albums;
    $$('[data-open-album]', editor).forEach(function (button) {
      button.onclick = function (event) {
        event.stopPropagation();
        var album = albums[Number(button.dataset.openAlbum)];
        openAlbumId = openAlbumId === album.id ? null : album.id;
        coverMenuId = null;
        renderPortfolio();
      };
    });
    $$('[data-del-album]', editor).forEach(function (button) {
      button.onclick = function (event) {
        event.stopPropagation();
        var i = Number(button.dataset.delAlbum);
        var album = albums[i];
        if (needConfirm('album-' + i, { eyebrow: 'Удаление', title: 'Удалить альбом?', text: 'Альбом «' + (album.title.ru || 'Без названия') + '» удалится со всеми фотографиями.', ok: 'Удалить альбом', danger: true }, function () { button.onclick(event); })) return;
        if (openAlbumId === album.id) openAlbumId = null;
        albums.splice(i, 1); setDirty('portfolio'); renderPortfolio();
      };
    });
    if (!grid) return;
    var dragEl = null;
    grid.addEventListener('dragstart', function (event) {
      var tile = event.target.closest ? event.target.closest('[data-album-tile]') : null;
      if (!tile) return;
      dragEl = tile; tile.classList.add('is-drag');
      event.dataTransfer.effectAllowed = 'move';
      try { event.dataTransfer.setData('text/plain', 'move'); } catch (e) {}
    });
    grid.addEventListener('dragover', function (event) {
      if (!dragEl) return;
      event.preventDefault();
      var tile = event.target.closest ? event.target.closest('[data-album-tile]') : null;
      if (!tile || tile === dragEl) return;
      var rect = tile.getBoundingClientRect();
      var before = (event.clientX - rect.left) < rect.width / 2;
      grid.insertBefore(dragEl, before ? tile : tile.nextSibling);
    });
    grid.addEventListener('drop', function (event) { if (dragEl) event.preventDefault(); });
    grid.addEventListener('dragend', function () {
      if (!dragEl) return;
      dragEl.classList.remove('is-drag');
      dragEl = null;
      var order = $$('[data-album-tile]', grid).map(function (tile) { return Number(tile.dataset.albumTile); });
      var changed = order.some(function (v, i) { return v !== i; });
      if (!changed) return;
      var next = order.map(function (i) { return albums[i]; });
      albums.splice.apply(albums, [0, albums.length].concat(next));
      setDirty('portfolio'); renderPortfolio();
    });
  }

  function bindAlbumEditor() {
    var root = $('.album-editor', $('#editor'));
    if (!root) return;
    var album = draft.portfolio.albums[Number(root.dataset.album)];
    bindPathEditable(root, album, 'data-ace', 'portfolio');
    var addImages = function (images) {
      album.photos = album.photos.concat(images).slice(0, 80);
      if (!album.previewId && album.photos[0]) album.previewId = album.photos[0].id;
      setDirty('portfolio'); renderPortfolio();
    };
    var remaining = Math.max(0, 80 - album.photos.length);
    var upload = $('[data-upload]', root);
    if (upload) upload.onclick = function () {
      if (!remaining) return toast('В одном альбоме может быть до 80 фотографий.');
      chooseFiles({ multiple: true, max: remaining }, addImages);
    };
    bindDropZone($('.upload-tile', root), addImages, remaining);
    $('[data-cover-menu]', root).onclick = function () {
      coverMenuId = coverMenuId === album.id ? null : album.id;
      renderPortfolio();
    };
    $$('[data-cover]', root).forEach(function (button) {
      button.onclick = function () {
        album.previewId = album.photos[Number(button.dataset.cover)].id;
        coverMenuId = null;
        setDirty('portfolio'); renderPortfolio();
      };
    });
    $$('[data-remove]', root).forEach(function (button) {
      button.onclick = function () {
        var i = Number(button.dataset.remove);
        var target = album.photos[i];
        if (needConfirm('album-photo-' + i, { eyebrow: 'Удаление', title: 'Удалить фотографию?', text: '«' + ((target && target.name) || 'Без названия') + '» будет убрана из альбома.', ok: 'Удалить', danger: true }, function () { button.onclick(); })) return;
        var removed = album.photos.splice(i, 1)[0];
        if (removed && removed.id === album.previewId) album.previewId = album.photos[0] ? album.photos[0].id : '';
        setDirty('portfolio'); renderPortfolio();
      };
    });
    (function () {
      function movePhoto(from, to) {
        if (from === to || from < 0 || to < 0 || from >= album.photos.length || to >= album.photos.length) return;
        var moved = album.photos.splice(from, 1)[0];
        album.photos.splice(to, 0, moved);
        setDirty('portfolio'); renderPortfolio();
      }
      $$('[data-move]', root).forEach(function (button) {
        button.onclick = function (event) {
          event.stopPropagation();
          var parts = button.getAttribute('data-move').split(':');
          movePhoto(Number(parts[0]), Number(parts[0]) + Number(parts[1]));
        };
      });
      var dragFrom = -1;
      $$('.media-tile.is-sortable', root).forEach(function (tile) {
        tile.addEventListener('dragstart', function (event) {
          dragFrom = Number(tile.getAttribute('data-photo-idx'));
          tile.classList.add('is-drag');
          try { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', String(dragFrom)); } catch (e) {}
        });
        tile.addEventListener('dragend', function () {
          tile.classList.remove('is-drag');
          $$('.media-tile', root).forEach(function (t) { t.classList.remove('is-drop'); });
        });
        tile.addEventListener('dragover', function (event) {
          event.preventDefault();
          try { event.dataTransfer.dropEffect = 'move'; } catch (e) {}
          tile.classList.add('is-drop');
        });
        tile.addEventListener('dragleave', function () { tile.classList.remove('is-drop'); });
        tile.addEventListener('drop', function (event) {
          event.preventDefault();
          tile.classList.remove('is-drop');
          var from = dragFrom;
          try { var dt = event.dataTransfer.getData('text/plain'); if (dt !== '') from = Number(dt); } catch (e) {}
          movePhoto(from, Number(tile.getAttribute('data-photo-idx')));
        });
      });
    })();
    $('[data-close-album]', root).onclick = function () { openAlbumId = null; coverMenuId = null; renderPortfolio(); };
  }

  function renderWork() {
    var work = draft.work;
    var cards = work.cards;
    var editor = $('#editor');
    editor.innerHTML = '<div class="panel"><div class="panel-head"><div><h2>Карточки услуг</h2><p>Настройте карточки услуг в том виде, в котором их увидят посетители сайта.</p></div></div>' +
      '<div class="svc-list">' + cards.map(workCard).join('') +
      '<button class="add-tile is-inline" type="button" id="addWork"><span>+</span> Добавить карточку</button></div></div>' +
      '<div class="panel"><div class="panel-head"><div><h2>Этапы съёмки</h2><p>Настройте названия этапов и их описания. Остальные элементы блока соответствуют дизайну сайта.</p></div></div>' +
      '<div class="cover-grid is-column">' + stagesMock(work, 'ru') + stagesMock(work, 'en') + '</div></div>';
    $('#addWork').onclick = function () {
      cards.push({ id: uid(), image: null, title: { ru: 'Новая услуга', en: 'New service' }, price: { ru: '', en: '' }, features: { ru: [], en: [] } });
      setDirty('work'); renderWork();
    };
    bindWorkCards();
    bindWorkStages();
    loadNativeMedia();
  }

  function workPlate(card, cardIndex, lang) {
    var list = (card.features && card.features[lang]) || [];
    return '<article class="svc-plate wkc" data-svc-lang="' + lang + '" data-plang="' + lang + '">' +
      '<div class="plate-head"><b>' + (lang === 'ru' ? 'Русская версия' : 'English') + '</b><span>' + (lang === 'ru' ? 'услуга' : 'service') + '</span></div>' +
      '<div class="wkimg" style="' + (card.image ? 'background-image:url(' + esc(card.image.url) + ')' : '') + '">' + (card.image ? '' : '<span class="pane-empty">Фотография не выбрана</span>') + '</div>' +
      '<div class="wk-info">' +
      '<div class="ce wkcap" data-ace="title.' + lang + '" spellcheck="false"></div>' +
      '<ul class="wk-feats">' + list.map(function (item, i) {
        return '<li><span class="ce wk-feat" data-feat="' + lang + ':' + i + '" spellcheck="false">' + esc(item) + '</span>' +
          '<button class="kill-btn is-mini" type="button" data-feat-del="' + lang + ':' + i + '" title="Удалить пункт">\u2715</button></li>';
      }).join('') + '</ul>' +
      '<button class="text-button" type="button" data-feat-add="' + lang + '">+ Пункт</button>' +
      '<div class="ce wkprice" data-ace="price.' + lang + '" spellcheck="false"></div>' +
      '</div></article>';
  }

  function workFileLine(card) {
    if (!card.image) return '<span class="wk-file is-empty">Фотография не выбрана</span>';
    var name = card.image.name || 'Без названия';
    var weight = Number(card.image.size)
      ? '<b>' + esc(fmtSize(card.image.size)) + '</b>'
      : '<b data-lazy-size="' + esc(card.image.url) + '">…</b>';
    return '<span class="wk-file" title="' + esc(name) + '"><i>◎</i><span class="wk-file-name">' + esc(name) + '</span>' + weight + '</span>';
  }

  function workCard(card, cardIndex) {
    return '<section class="svc-card" data-work="' + cardIndex + '">' +
      '<div class="svc-tools"><button class="button button-light" type="button" data-work-image>' + (card.image ? 'Заменить фотографию' : 'Выбрать фотографию') + '</button>' +
      workFileLine(card) +
      '<button class="kill-btn" type="button" data-delete-work title="Удалить карточку">\u2715</button></div>' +
      '<div class="svc-pair">' + workPlate(card, cardIndex, 'ru') + workPlate(card, cardIndex, 'en') + '</div>' +
      '</section>';
  }

  function bindWorkCards() {
    try { fillSizes($('#editor')); } catch (e) {}
    $$('.svc-card[data-work]', $('#editor')).forEach(function (root) {
      var cardIndex = Number(root.dataset.work);
      var card = draft.work.cards[cardIndex];
      bindPathEditable(root, card, 'data-ace', 'work');
      $$('[data-feat]', root).forEach(function (el) {
        var parts = el.getAttribute('data-feat').split(':');
        var lang = parts[0];
        var i = Number(parts[1]);
        el.setAttribute('contenteditable', 'true');
        el.addEventListener('keydown', function (event) { if (event.key === 'Enter') { event.preventDefault(); el.blur(); } });
        el.addEventListener('input', function () {
          card.features[lang][i] = el.innerText.replace(/\s+/g, ' ').trim();
          setDirty('work');
        });
      });
      $$('[data-feat-del]', root).forEach(function (button) {
        button.onclick = function () {
          var parts = button.dataset.featDel.split(':');
          card.features[parts[0]].splice(Number(parts[1]), 1);
          setDirty('work'); renderWork();
        };
      });
      $$('[data-feat-add]', root).forEach(function (button) {
        button.onclick = function () {
          var lang = button.dataset.featAdd;
          if (!card.features[lang]) card.features[lang] = [];
          card.features[lang].push(lang === 'ru' ? 'Новый пункт' : 'New item');
          setDirty('work'); renderWork();
        };
      });
      $('[data-work-image]', root).onclick = function () {
        chooseFiles({ multiple: false }, function (images) {
          card.image = images[0];
          setDirty('work');
          renderWork();
          if (card.image) toast('Фотография «' + (card.image.name || 'без названия') + '» загружена' + (Number(card.image.size) ? ' — ' + fmtSize(card.image.size) : ''));
        });
      };
      $('[data-delete-work]', root).onclick = function () {
        if (needConfirm('work-card-' + cardIndex, { eyebrow: 'Удаление', title: 'Удалить карточку?', text: 'Карточка «' + (card.title.ru || 'Без названия') + '» исчезнет из раздела услуг.', ok: 'Удалить', danger: true }, function () { $('[data-delete-work]', root).onclick(); })) return;
        draft.work.cards.splice(cardIndex, 1); setDirty('work'); renderWork();
      };
    });
  }

  function stagesMock(work, lang) {
    return '<article class="cover-plate site-plate" data-plang="' + lang + '">' +
      '<div class="plate-head"><b>' + (lang === 'ru' ? 'Русская версия' : 'English') + '</b><span>' + (lang === 'ru' ? 'Этапы съёмки' : 'Shooting stages') + '</span></div>' +
      '<div class="plate-body is-steps">' +
      '<div class="rdm-heading">' +
      '<div class="ce rdm-heading-txt" data-wce="stagesHead.title.' + lang + '" spellcheck="false"></div>' +
      '<div class="ce rdm-heading-sub" data-wce="stagesHead.sub.' + lang + '" spellcheck="false"></div>' +
      '</div>' +
      '<div class="rdm-card"><div class="rdm-rel"><div class="rdm-line"></div><div class="rdm-row">' +
      work.stages.map(function (stage, i) {
        return '<div class="rdm-item" data-work-stage="' + i + '" data-lang="' + lang + '">' +
          '<span class="rdm-dot"><i></i></span>' +
          '<span class="ce rdm-badge" data-wsce="badge.' + lang + '" spellcheck="false"></span>' +
          '<div class="ce rdm-title" data-wsce="title.' + lang + '" spellcheck="false"></div>' +
          '<div class="ce rdm-text" data-wsce="text.' + lang + '" data-multiline spellcheck="false"></div>' +
          '</div>';
      }).join('') +
      '</div></div></div></div></article>';
  }

  function bindWorkStages() {
    var editor = $('#editor');
    bindPathEditable(editor, draft.work, 'data-wce', 'work');
    $$('[data-work-stage]', editor).forEach(function (row) {
      bindPathEditable(row, draft.work.stages[Number(row.dataset.workStage)], 'data-wsce', 'work');
    });
  }

  function enableFaqReorder(container, list, done) {
    if (!container) return;
    $$('.faq-admin-item', container).forEach(function (item, i) { item.dataset.index = i; });
    var dragEl = null;
    $$('.faq-drag', container).forEach(function (handle) {
      var arm = function () { handle.closest('.faq-admin-item').setAttribute('draggable', 'true'); };
      handle.addEventListener('mousedown', arm);
      handle.addEventListener('touchstart', arm, { passive: true });
    });
    container.addEventListener('dragstart', function (event) {
      var item = event.target.closest ? event.target.closest('.faq-admin-item') : null;
      if (!item || item.getAttribute('draggable') !== 'true') return;
      dragEl = item;
      item.classList.add('is-drag');
      event.dataTransfer.effectAllowed = 'move';
      try { event.dataTransfer.setData('text/plain', 'reorder'); } catch (e) {}
    });
    container.addEventListener('dragover', function (event) {
      if (!dragEl) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      var item = event.target.closest ? event.target.closest('.faq-admin-item') : null;
      if (!item || item === dragEl) return;
      var rect = item.getBoundingClientRect();
      var before = (event.clientY - rect.top) < rect.height / 2;
      container.insertBefore(dragEl, before ? item : item.nextSibling);
    });
    container.addEventListener('drop', function (event) { if (dragEl) event.preventDefault(); });
    container.addEventListener('dragend', function () {
      if (!dragEl) return;
      dragEl.classList.remove('is-drag');
      dragEl.removeAttribute('draggable');
      dragEl = null;
      var order = $$('.faq-admin-item', container).map(function (item) { return Number(item.dataset.index); });
      var changed = order.some(function (v, i) { return v !== i; });
      if (!changed) return;
      var next = order.map(function (i) { return list[i]; });
      list.splice.apply(list, [0, list.length].concat(next));
      done();
    });
  }

  function renderContacts() {
    var contacts = draft.contacts;
    var faq = draft.faq;
    var editor = $('#editor');
    editor.innerHTML =
      '<div class="panel"><div class="panel-head"><div><h2>Контакты</h2><p>Укажите актуальные ссылки и номер телефона — остальные элементы блока обновятся автоматически.</p></div></div>' +
      '<div class="ct-admin-grid">' + contacts.map(function (c, i) {
        return '<div class="ct-card"><div class="ct-card-head">' + CONTACT_ICONS[c.type] + '<div class="cc-t"><span class="cc-l">' + esc(c.label) + '</span><span class="cc-s" data-ct-sub="' + i + '">' + esc(c.value) + '</span></div></div>' +
          '<label class="field"><span>' + (c.type === 'phone' ? 'Номер телефона' : 'Ссылка') + '</span><input data-ct-link="' + i + '" value="' + esc(c.type === 'phone' ? c.value : c.href) + '" placeholder="' + (c.type === 'phone' ? '+7 900 000-00-00' : 'https://…') + '"></label></div>';
      }).join('') + '</div>' +
      '<p class="help">Если очистить поле — плашка не будет показываться на сайте.</p></div>' +
      '<div class="panel"><div class="panel-head"><div><h2 class="h2-uni">Вопросы и ответы (FAQ)</h2><p>Замените существующие вопросы своими или отредактируйте текущие.</p></div><button id="addFaq" class="button button-light" type="button">Добавить вопрос</button></div>' +
      '<div id="faqRows">' + faq.map(function (f, i) {
        return '<div class="faq-admin-item"><div class="faq-admin-head"><span class="faq-head-left"><span class="faq-drag" title="Перетащите, чтобы поменять порядок">⣿</span><b>Вопрос ' + (i + 1) + '</b></span><button type="button" class="text-button" data-faq-del="' + i + '">Удалить</button></div><div class="field-grid">' +
          '<label class="field"><span>Вопрос · Русский</span><textarea data-faq="' + i + '.q.ru">' + esc(f.q.ru) + '</textarea></label>' +
          '<label class="field" data-plang="en"><span>Вопрос · English</span><textarea data-faq="' + i + '.q.en">' + esc(f.q.en) + '</textarea></label>' +
          '<label class="field"><span>Ответ · Русский</span><textarea data-faq="' + i + '.a.ru">' + esc(f.a.ru) + '</textarea></label>' +
          '<label class="field" data-plang="en"><span>Ответ · English</span><textarea data-faq="' + i + '.a.en">' + esc(f.a.en) + '</textarea></label>' +
          '</div></div>';
      }).join('') + '</div></div>';
    $$('[data-ct-link]', editor).forEach(function (input) {
      input.oninput = function () {
        var i = Number(input.dataset.ctLink);
        var r = contactAuto(contacts[i].type, input.value);
        if (contacts[i].type === 'phone' && input.value !== r.s) input.value = r.s;
        contacts[i].href = r.h; contacts[i].value = r.s; contacts[i].label = r.l;
        var sub = $('[data-ct-sub="' + i + '"]', editor); if (sub) sub.textContent = r.s;
        setDirty();
      };
    });
    $$('[data-faq]', editor).forEach(function (input) {
      input.oninput = function () {
        var p = input.getAttribute('data-faq').split('.');
        faq[Number(p[0])][p[1]][p[2]] = input.value;
        setDirty();
      };
      var fit = function () { input.style.height = 'auto'; input.style.height = (input.scrollHeight + 4) + 'px'; };
      requestAnimationFrame(fit);
      input.addEventListener('input', fit);
    });
    $$('[data-faq-del]', editor).forEach(function (b) {
      b.onclick = function () {
        var i = Number(b.dataset.faqDel);
        if (needConfirm('faq-' + i, { eyebrow: 'Удаление', title: 'Удалить вопрос?', text: '«' + ((faq[i].q.ru || faq[i].q.en || 'Без текста') + '').slice(0, 90) + '» больше не будет показываться на сайте.', ok: 'Удалить', danger: true }, function () { b.onclick(); })) return;
        faq.splice(i, 1); setDirty(); renderContacts();
      };
    });
    $('#addFaq').onclick = function () { faq.push({ id: uid(), q: { ru: '', en: '' }, a: { ru: '', en: '' } }); setDirty(); renderContacts(); };
    enableFaqReorder($('#faqRows'), faq, function () { setDirty(); renderContacts(); });
  }

  function contactRow(contact, index) {
    return '<div class="contact-row" data-contact="' + index + '"><label class="field"><span>Тип</span><select data-contact-bind="type">' +
      ['telegram', 'instagram', 'max', 'phone', 'email', 'website'].map(function (type) { return '<option value="' + type + '"' + (contact.type === type ? ' selected' : '') + '>' + typeName(type) + '</option>'; }).join('') +
      '</select></label>' + fieldContact('Подпись', contact.label, 'label', 'Telegram') + fieldContact('Ссылка', contact.href, 'href', 'https://t.me/...') +
      '<button class="tiny-button" type="button" data-delete-contact aria-label="Удалить ссылку">×</button></div>';
  }

  function fieldContact(label, value, key, placeholder) {
    return '<label class="field"><span>' + label + '</span><input data-contact-bind="' + key + '" value="' + esc(value) + '" placeholder="' + esc(placeholder) + '"></label>';
  }

  function typeName(type) {
    return { telegram: 'Telegram', instagram: 'Instagram', max: 'MAX', phone: 'Телефон', email: 'Почта', website: 'Сайт' }[type] || type;
  }

  function emptyBlock(title, note, action, id) {
    return '<div class="empty"><h3>' + title + '</h3><p>' + note + '</p><button id="' + id + '" class="button button-dark" type="button">' + action + '</button></div>';
  }

  function imageForHome(side) {
    var mode = device === 'mobile' ? 'mobile' : 'desktop';
    return draft.home[mode][side] || draft.home.desktop[side] || null;
  }

  var previewLang = 'ru';

  function fitPreviewScale(frame) {
    var pvBox = $('.pv-scale', frame), pvIfr = $('.pv-iframe', frame);
    if (!pvBox || !pvIfr) return;
    var pvW = device === 'mobile' ? 390 : 1280, pvH = device === 'mobile' ? 800 : 820;
    var pvFit = function () {
      if (!document.body.contains(pvBox)) return;
      var avail = Math.max(220, frame.clientWidth - 16);
      var k = Math.min(1, avail / pvW);
      pvIfr.style.width = pvW + 'px';
      pvIfr.style.height = pvH + 'px';
      pvIfr.style.transform = 'scale(' + k + ')';
      pvBox.style.width = Math.round(pvW * k) + 'px';
      pvBox.style.height = Math.round(pvH * k) + 'px';
    };
    if (window.__pvFit) window.removeEventListener('resize', window.__pvFit);
    window.__pvFit = pvFit;
    window.addEventListener('resize', pvFit);
    pvFit();
  }

  function syncPreviewBar() {
    $$('[data-pvlang]').forEach(function (b) {
      b.onclick = function () { previewLang = b.getAttribute('data-pvlang'); renderPreview(); };
      b.classList.toggle('is-active', b.getAttribute('data-pvlang') === previewLang);
    });
    var rpb = $('#pvReplay');
    if (rpb) rpb.hidden = active !== 'loader';
  }

  function renderPreview() {
    var frame = $('#previewFrame');
    frame.className = 'preview-frame ' + device;
    syncPreviewBar();
    var nav = '<div class="pv-nav"><b>Alisa Miterova</b><span>PORTFOLIO&nbsp;&nbsp;&nbsp; WORK&nbsp;&nbsp;&nbsp; КОНТАКТЫ</span></div>';
    if (active === 'loader') {
      frame.innerHTML = '<div class="pv-loading">Загружаем настоящий лоадер…</div>';
      api('preview-content', { method: 'POST', json: draft }).then(function (result) {
        if (active !== 'loader' || $('#previewModal').classList.contains('is-hidden')) return;
        try { sessionStorage.setItem('cmsPreviewContent', JSON.stringify(result.content || {})); } catch (e) {}
        frame.classList.add('is-live');
        frame.innerHTML = '<div class="pv-scale"><iframe class="pv-iframe" src="/?cmsPreview=1&cmsLoaderLoop=1&cmsLang=' + previewLang + '&t=' + Date.now() + '" title="Предпросмотр сайта"></iframe></div>';
        var rp = $('#pvReplay');
        if (rp) rp.onclick = function () { var f = $('.pv-iframe', frame); if (f) f.src = '/?cmsPreview=1&cmsLoaderLoop=1&cmsLang=' + previewLang + '&t=' + Date.now(); };
        fitPreviewScale(frame);
      }).catch(function (error) {
        frame.innerHTML = '<div class="pv-loading">Не удалось открыть предпросмотр: ' + esc(error.message) + '</div>';
      });
    }
    if (active === 'home') {
      frame.innerHTML = '<div class="pv-loading">Загружаем настоящую главную…</div>';
      api('preview-content', { method: 'POST', json: Object.assign({ __mode: device === 'mobile' ? 'mobile' : 'desktop' }, draft) }).then(function (result) {
        if (active !== 'home' || $('#previewModal').classList.contains('is-hidden')) return;
        try { sessionStorage.setItem('cmsPreviewContent', JSON.stringify(result.content || {})); } catch (e) {}
        frame.classList.add('is-live');
        frame.innerHTML = '<div class="pv-scale"><iframe class="pv-iframe" src="/?cmsPreview=1&cmsHome=1&cmsLang=' + previewLang + '&t=' + Date.now() + '" title="Предпросмотр главной"></iframe></div>';
        fitPreviewScale(frame);
      }).catch(function (error) {
        frame.innerHTML = '<div class="pv-loading">Не удалось открыть предпросмотр: ' + esc(error.message) + '</div>';
      });
    }
    if (active === 'portfolio') {
      frame.innerHTML = '<div class="pv-loading">Загружаем раздел Портфолио…</div>';
      api('preview-content', { method: 'POST', json: draft }).then(function (result) {
        if (active !== 'portfolio' || $('#previewModal').classList.contains('is-hidden')) return;
        try { sessionStorage.setItem('cmsPreviewContent', JSON.stringify(result.content || {})); } catch (e) {}
        frame.classList.add('is-live');
        frame.innerHTML = '<div class="pv-scale"><iframe class="pv-iframe" src="/?cmsPreview=1&cmsHome=1&cmsSec=pf&cmsLang=' + previewLang + '&t=' + Date.now() + '" title="Предпросмотр раздела Портфолио"></iframe></div>';
        fitPreviewScale(frame);
      }).catch(function (error) {
        frame.innerHTML = '<div class="pv-loading">Не удалось открыть предпросмотр: ' + esc(error.message) + '</div>';
      });
    }
    if (active === 'work') {
      frame.innerHTML = '<div class="pv-loading">Загружаем раздел Услуги…</div>';
      api('preview-content', { method: 'POST', json: draft }).then(function (result) {
        if (active !== 'work' || $('#previewModal').classList.contains('is-hidden')) return;
        try { sessionStorage.setItem('cmsPreviewContent', JSON.stringify(result.content || {})); } catch (e) {}
        frame.classList.add('is-live');
        frame.innerHTML = '<div class="pv-scale"><iframe class="pv-iframe" src="/?cmsPreview=1&cmsHome=1&cmsSec=wk&cmsLang=' + previewLang + '&t=' + Date.now() + '" title="Предпросмотр раздела Услуги"></iframe></div>';
        fitPreviewScale(frame);
      }).catch(function (error) {
        frame.innerHTML = '<div class="pv-loading">Не удалось открыть предпросмотр: ' + esc(error.message) + '</div>';
      });
    }
    if (active === 'contacts') {
      frame.innerHTML = '<div class="pv-loading">Загружаем раздел Контакты…</div>';
      api('preview-content', { method: 'POST', json: draft }).then(function (result) {
        if (active !== 'contacts' || $('#previewModal').classList.contains('is-hidden')) return;
        try { sessionStorage.setItem('cmsPreviewContent', JSON.stringify(result.content || {})); } catch (e) {}
        frame.classList.add('is-live');
        frame.innerHTML = '<div class="pv-scale"><iframe class="pv-iframe" src="/?cmsPreview=1&cmsHome=1&cmsSec=ct&cmsLang=' + previewLang + '&t=' + Date.now() + '" title="Предпросмотр контактов"></iframe></div>';
        fitPreviewScale(frame);
      }).catch(function (error) {
        frame.innerHTML = '<div class="pv-loading">Не удалось открыть предпросмотр: ' + esc(error.message) + '</div>';
      });
    }
  }

  function openPreview() { renderPreview(); $('#previewModal').classList.remove('is-hidden'); document.body.style.overflow = 'hidden'; }
  function closePreview() { $('#previewModal').classList.add('is-hidden'); document.body.style.overflow = ''; }
  var confirmResolve = null;

  function askConfirmBox(options) {
    var o = options || {};
    var eyebrow = $('#confirmEyebrow');
    var text = $('#confirmText');
    if (eyebrow) eyebrow.textContent = o.eyebrow || 'Подтверждение';
    $('#confirmTitle').textContent = o.title || 'Подтвердите действие';
    if (text) text.textContent = o.text || '';
    var ok = $('#confirmPublish');
    var cancel = $('#cancelPublish');
    ok.textContent = o.ok || 'Продолжить';
    ok.disabled = false;
    ok.classList.toggle('is-danger', !!o.danger);
    cancel.textContent = o.cancel || 'Отмена';
    $('#confirmModal').classList.remove('is-hidden');
    setTimeout(function () { try { ok.focus(); } catch (e) {} }, 30);
    if (confirmResolve) { var previous = confirmResolve; confirmResolve = null; previous(false); }
    return new Promise(function (resolve) { confirmResolve = resolve; });
  }

  function settleConfirm(value) {
    $('#confirmModal').classList.add('is-hidden');
    var resolve = confirmResolve;
    confirmResolve = null;
    if (resolve) resolve(!!value);
  }

  var confirmedOnce = {};

  function needConfirm(key, options, rerun) {
    if (confirmedOnce[key]) { delete confirmedOnce[key]; return false; }
    askConfirmBox(options).then(function (ok) {
      if (!ok) return;
      confirmedOnce[key] = true;
      try { rerun(); } finally { delete confirmedOnce[key]; }
    });
    return true;
  }

  function askPublish() {
    closePreview();
    askConfirmBox({
      eyebrow: 'Последняя проверка',
      title: 'Опубликовать изменения?',
      text: 'Новые фотографии и тексты станут доступны на сайте.',
      ok: 'Опубликовать',
      cancel: 'Ещё проверить'
    }).then(function (ok) { if (ok) publish(); });
  }
  function closeConfirm() { $('#confirmModal').classList.add('is-hidden'); }

  function publish() {
    $('#confirmPublish').disabled = true;
    $('#publish').disabled = true;
    api('admin-content', { method: 'PUT', json: draft }).then(function (result) {
      saved = clone(result.content || draft);
      draft = normalize(clone(saved));
      baseJson = JSON.stringify(draft);
      clearDirty();
      closeConfirm();
      toast('Изменения опубликованы');
      render();
    }).catch(function (error) {
      toast(error.message);
    }).then(function () {
      $('#confirmPublish').disabled = false;
      $('#publish').disabled = false;
    });
  }

  function showApp(state) {
    csrf = state.csrf || csrf;
    if (state.limits) LIMITS = state.limits;
    saved = normalize(state.content && state.content.admin ? state.content.admin : state.content);
    draft = clone(saved);
    baseJson = JSON.stringify(draft);
    $('#login').classList.add('is-hidden');
    $('#adminApp').classList.remove('is-hidden');
    clearDirty();
    render();
  }

  function showLogin(message) {
    $('#adminApp').classList.add('is-hidden');
    $('#login').classList.remove('is-hidden');
    if (message) $('#loginError').textContent = message;
  }

  $('#filePicker').onchange = function () {
    if (!uploadCallback || !this.files.length) return;
    var callback = uploadCallback;
    var maxFiles = uploadLimit;
    uploadCallback = null;
    uploadLimit = 0;
    uploadFiles(this.files, maxFiles).then(function (images) { callback(images); toast(images.length > 1 ? 'Фотографии готовы' : 'Фотография готова'); }).catch(function (error) { toast(error.message); });
  };
  $('#loginForm').onsubmit = function (event) {
    event.preventDefault();
    $('#loginError').textContent = '';
    api('login', { method: 'POST', json: { u: $('#loginName').value, p: $('#loginPassword').value } })
      .then(function (result) { csrf = result.csrf; return api('state'); })
      .then(showApp).catch(function (error) { $('#loginError').textContent = error.message; });
  };
  $('#logout').onclick = function () { api('logout', { method: 'POST' }).then(function () { location.reload(); }).catch(function () { location.reload(); }); };
  $('#magicLink').onclick = function () {
    api('magic', { method: 'POST' }).then(function (result) {
      var link = location.origin + location.pathname + '?ml=' + encodeURIComponent(result.token);
      if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(link).then(function () { toast('Magic link скопирована — ссылка для входа скопирована. Действует 15 минут.'); });
      window.prompt('Скопируйте ссылку. Она действует 15 минут:', link);
    }).catch(function (error) { toast(error.message); });
  };
  var passEyeBtn = $('#passEye');
  if (passEyeBtn) passEyeBtn.onclick = function () {
    var inp = $('#loginPassword');
    var show = inp.type === 'password';
    inp.type = show ? 'text' : 'password';
    this.classList.toggle('is-on', show);
    this.setAttribute('aria-label', show ? 'Скрыть пароль' : 'Показать пароль');
    inp.focus();
  };
  function closeSettings() { $('#settingsModal').classList.add('is-hidden'); }
  function initials(name) {
    var parts = String(name || '?').trim().split(/\s+/);
    return ((parts[0] || '?')[0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
  }
  function renderAdminList() {
    $('#adminList').innerHTML = '<p class="set-note">Загружаю список…</p>';
    api('admins').then(function (result) {
      var list = result.admins || [];
      var me = list.filter(function (a) { return a.you; })[0];
      var iAmOwner = !!(me && me.root);
      var box = $('#addAdminBox');
      if (box) box.classList.toggle('is-hidden', !iAmOwner);
      var rows = list.map(function (a) {
        var canDelete = iAmOwner && !a.you && !a.root;
        var canEdit = iAmOwner || a.you;
        return '<div class="admin-row' + (a.you ? ' is-you' : '') + '">' +
          '<span class="ar-ava">' + esc(initials(a.name || a.user)) + '</span>' +
          '<div class="ar-main">' +
          '<b>' + esc(a.name || a.user) +
          (a.tag ? '<span class="ar-chip is-owner">' + esc(a.tag) + '</span>' : '') +
          (a.you ? '<span class="ar-chip">это вы</span>' : '') + '</b>' +
          '<small>логин: ' + esc(a.user) + '</small>' +
          '<label class="ar-tag"><span>Префикс</span>' +
          '<input type="text" maxlength="40" placeholder="' + (a.root ? 'Владелец' : 'без префикса') + '" value="' + esc(a.tag || '') + '"' +
          (canEdit ? ' data-admin-tag="' + esc(a.id) + '"' : ' disabled') + '></label>' +
          '</div>' +
          (canDelete ? '<button type="button" class="ar-del" data-admin-del="' + esc(a.id) + '" title="Удалить">Удалить</button>' : '') +
          '</div>';
      }).join('');
      $('#adminList').innerHTML = rows || '<p class="set-note">Пока только владелец.</p>';
      $$('#adminList [data-admin-tag]').forEach(function (input) {
        var initial = input.value;
        input.onblur = function () {
          var value = input.value.trim();
          if (value === initial) return;
          api('admin-edit', { method: 'POST', json: { id: input.dataset.adminTag, tag: value } })
            .then(function () { initial = value; toast('Префикс обновлён'); })
            .catch(function (error) { input.value = initial; toast(error.message); });
        };
        input.onkeydown = function (event) { if (event.key === 'Enter') input.blur(); };
      });
      $$('#adminList [data-admin-del]').forEach(function (button) {
        button.onclick = function () {
          if (needConfirm('admin-' + button.dataset.adminDel, { eyebrow: 'Удаление', title: 'Удалить администратора?', text: 'Он больше не сможет войти в панель управления.', ok: 'Удалить', danger: true }, function () { button.onclick(); })) return;
          api('admin-del', { method: 'POST', json: { id: button.dataset.adminDel } })
            .then(function () { toast('Администратор удалён'); renderAdminList(); })
            .catch(function (error) { toast(error.message); });
        };
      });
    }).catch(function (error) {
      $('#adminList').innerHTML = '<p class="set-note">' + esc(error.message) + '</p>';
    });
  }
  $$('[data-eye]').forEach(function (button) {
    button.onclick = function () {
      var input = document.getElementById(button.dataset.eye);
      if (!input) return;
      var show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      button.classList.toggle('is-on', show);
      button.setAttribute('aria-label', show ? 'Скрыть пароль' : 'Показать пароль');
      input.focus();
    };
  });
  (function () {
    syncAutoTrUi();
    var cb = $('#autoTr');
    if (cb) {
      cb.checked = autoTrOn();
      cb.onchange = function () { setAutoTr(cb.checked); render(); toast(cb.checked ? 'Автоперевод включен' : 'Автоперевод выключен'); };
    }
    var ta = $('#trAll');
    if (ta) ta.onclick = function () {
      ta.disabled = true;
      toast('Переводим…');
      translateAll().then(function (n) { ta.disabled = false; render(); toast('Переведено полей: ' + n); })
        .catch(function (e) { ta.disabled = false; toast((e && e.message) || 'Не удалось перевести'); });
    };
  })();

  function setSettingsTab(name) {
    $$('#setTabs [data-set-tab]').forEach(function (b) { b.classList.toggle('is-active', b.dataset.setTab === name); });
    $$('[data-set-pane]').forEach(function (p) { p.classList.toggle('is-active', p.dataset.setPane === name); });
  }
  function fmtSize(bytes) {
    var b = Number(bytes) || 0;
    if (b >= 1024 * 1024 * 1024) return (b / (1024 * 1024 * 1024)).toFixed(2).replace('.', ',') + ' ГБ';
    if (b >= 1024 * 1024) return (b / (1024 * 1024)).toFixed(1).replace('.', ',') + ' МБ';
    if (b >= 1024) return Math.round(b / 1024) + ' КБ';
    return b + ' Б';
  }
  function fmtPct(used, limit) {
    if (!used) return '0%';
    var p = used / limit * 100;
    if (p >= 100) return '100%';
    var text;
    if (p >= 10) text = p.toFixed(1);
    else if (p >= 1) text = p.toFixed(2);
    else if (p >= 0.01) text = p.toFixed(3);
    else return '<0,01%';
    text = text.replace(/0+$/, '').replace(/\.$/, '');
    return text.replace('.', ',') + '%';
  }
  function paintStorage(used, limit, files) {
    limit = limit || STORAGE_LIMIT;
    var free = Math.max(0, limit - used);
    var pct = Math.round(used / limit * 1000) / 10;
    if (pct > 100) pct = 100;
    var fill = $('#stgFill');
    if (fill) fill.style.width = (used > 0 && pct < 1.5 ? 1.5 : pct) + '%';
    if ($('#stgUsed')) $('#stgUsed').textContent = (used ? fmtSize(used) : '0 КБ') + ' (' + fmtPct(used, limit) + ')';
    if ($('#stgFree')) $('#stgFree').textContent = fmtSize(free);
    if ($('#stgAll')) $('#stgAll').textContent = fmtSize(limit);
    if ($('#stgFiles')) $('#stgFiles').textContent = files === undefined || files === null ? '\u2014' : String(files);
  }
  function renderStorage() {
    paintStorage(usedBytes(), STORAGE_LIMIT, null);
    api('storage').then(function (r) {
      if (r && r.limit) paintStorage(Number(r.used) || 0, Number(r.limit), r.files);
      if ($('#stgJunk')) {
        var n = Number(r && r.unused) || 0;
        $('#stgJunk').textContent = n ? n + ' файл(ов) не используется на сайте' : 'Все файлы используются на сайте';
      }
      if ($('#stgClean')) $('#stgClean').disabled = !(Number(r && r.unused) || 0);
    }).catch(function () {});
  }
  if ($('#stgClean')) $('#stgClean').onclick = function () {
    var btn = $('#stgClean');
    btn.disabled = true;
    api('storage-gc', { method: 'POST' }).then(function (r) {
      var n = Number(r && r.removed) || 0;
      toast(n ? 'Удалено неиспользуемых файлов: ' + n : 'Неиспользуемых файлов нет');
      renderStorage();
    }).catch(function (e) { toast(e.message); btn.disabled = false; });
  };
  $$('#setTabs [data-set-tab]').forEach(function (b) {
    b.onclick = function () { setSettingsTab(b.dataset.setTab); if (b.dataset.setTab === 'storage') renderStorage(); };
  });
  $('#openSettings').onclick = function () {
    $('#settingsModal').classList.remove('is-hidden');
    setSettingsTab('admins');
    renderAdminList();
    renderStorage();
  };
  $('#closeSettings').onclick = closeSettings;
  $('#settingsModal').onclick = function (event) { if (event.target === this) closeSettings(); };
  $('#addAdmin').onclick = function () {
    var tag = $('#naTag') ? $('#naTag').value.trim() : '';
    var user = $('#naUser').value.trim();
    var pass = $('#naPass').value;
    if (!user) { toast('Укажите логин'); return; }
    if (pass.length < 8) { toast('Пароль должен быть не короче 8 символов'); return; }
    api('admin-add', { method: 'POST', json: { name: user, tag: tag, user: user, password: pass } }).then(function () {
      toast('Администратор создан');
      if ($('#naTag')) $('#naTag').value = ''; $('#naUser').value = ''; $('#naPass').value = '';
      if ($('#addAdminBox')) $('#addAdminBox').open = false;
      renderAdminList();
    }).catch(function (error) { toast(error.message); });
  };
  $('#changePass').onclick = function () {
    var oldPass = $('#cpOld').value;
    var newPass = $('#cpNew').value;
    if (newPass.length < 8) { toast('Новый пароль должен быть не короче 8 символов'); return; }
    api('password', { method: 'POST', json: { old: oldPass, password: newPass } }).then(function () {
      toast('Пароль обновлён. Теперь входите с новым паролем.');
      $('#cpOld').value = ''; $('#cpNew').value = '';
    }).catch(function (error) { toast(error.message); });
  };
  $('#menuToggle').onclick = function (event) {
    event.stopPropagation();
    var open = document.body.classList.toggle('menu-open');
    this.setAttribute('aria-expanded', String(open));
  };
  document.addEventListener('click', function (event) {
    if (!document.body.classList.contains('menu-open')) return;
    var target = event.target;
    if (target.closest && (target.closest('.sidebar') || target.closest('#menuToggle'))) return;
    document.body.classList.remove('menu-open');
    $('#menuToggle').setAttribute('aria-expanded', 'false');
  });
  ['#mhTr', '#trDesk'].forEach(function (selector) {
    var button = $(selector);
    if (!button) return;
    button.onclick = function () {
      var on = !autoTrOn();
      setAutoTr(on);
      var cb = $('#autoTr');
      if (cb) cb.checked = on;
      render();
      toast(on ? 'Автоперевод включён' : 'Автоперевод выключен');
    };
  });
  (function () {
    var head = document.querySelector('.mobile-head');
    if (!head) return;
    var bar = $('#mhProgress');
    function onScroll() {
      var y = window.scrollY || document.documentElement.scrollTop || 0;
      head.classList.toggle('is-stuck', y > 4);
      if (bar) {
        var total = (document.documentElement.scrollHeight - window.innerHeight) || 1;
        var ratio = Math.max(0, Math.min(1, y / total));
        bar.style.width = (ratio * 100).toFixed(2) + '%';
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
  })();
  syncAutoTrUi();
  syncMobileFlags();
  $$('[data-preview]').forEach(function (button) { button.onclick = openPreview; });
  $('#closePreview').onclick = closePreview;
  $('#previewModal').onclick = function (event) { if (event.target === this) closePreview(); };
  $$('[data-device]').forEach(function (button) {
    button.onclick = function () {
      device = button.dataset.device;
      $$('[data-device]').forEach(function (b) { b.classList.toggle('is-active', b === button); });
      renderPreview();
    };
  });
  $('#publish').onclick = askPublish;
  $('#publishFromPreview').onclick = askPublish;
  $('#cancelPublish').onclick = function () { settleConfirm(false); };
  $('#confirmPublish').onclick = function () { settleConfirm(true); };
  $('#confirmModal').onclick = function (event) { if (event.target === this) settleConfirm(false); };
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') { closePreview(); settleConfirm(false); closeSettings(); document.body.classList.remove('menu-open'); }
  });
  window.addEventListener('beforeunload', function (event) {
    if (!Object.keys(dirtySections).length) return;
    event.preventDefault();
    event.returnValue = '';
  });

  var localPreview = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && new URLSearchParams(location.search).get('preview') === '1';
  if (localPreview) {
    showApp({ content: { admin: demoContent() }, csrf: '' });
    $('#draftState').textContent = 'Демонстрационный режим';
    $('#publish').disabled = true;
    $('#publishFromPreview').disabled = true;
    $('#magicLink').classList.add('is-hidden');
    $('#openSettings').classList.add('is-hidden');
    $('#logout').textContent = 'Локальный просмотр';
    $('#logout').disabled = true;
    return;
  }

  showLogin();
  var magic = null;
  try { magic = new URLSearchParams(location.search).get('ml'); } catch (e) {}
  if (magic) {
    history.replaceState(null, '', location.pathname);
    api('mlogin', { method: 'POST', json: { t: magic } }).then(function (result) { csrf = result.csrf; return api('state'); }).then(showApp).catch(function (error) { showLogin(error.message); });
  } else {
    api('state').then(showApp).catch(function (error) {
      if (error.status !== 401) showLogin('Сервер временно недоступен. Попробуйте обновить страницу.');
    });
  }
})();

(function () {
  'use strict';

  var API = '/api/';
  var csrf = '';
  var saved = null;
  var draft = null;
  var active = 'loader';
  var device = 'desktop';
  var screenMode = 'desktop';
  var uploadCallback = null;
  var uploadLimit = 0;
  var dirtySections = {};

  var sections = [
    { id: 'loader', index: '01', label: 'Лоадер', title: 'Первое впечатление', note: 'Фотографии в центре, заголовок и короткая подпись.' },
    { id: 'home', index: '02', label: 'Главная страница', title: 'Главная страница', note: 'Отдельные кадры для широких, средних и мобильных экранов.' },
    { id: 'portfolio', index: '03', label: 'PORTFOLIO', title: 'Portfolio', note: 'Альбомы, фотографии, превью каждого раздела и блок о себе.' },
    { id: 'work', index: '04', label: 'WORK', title: 'Work', note: 'Карточки услуг и понятные этапы работы с клиентом.' },
    { id: 'contacts', index: '05', label: 'КОНТАКТЫ', title: 'Контакты', note: 'Ссылки, по которым посетитель сможет быстро связаться с вами.' }
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

var CONTACT_ICONS = { telegram: '<svg viewBox="0 0 24 24" fill="currentColor" fill-rule="evenodd" aria-hidden="true"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>', instagram: '<svg viewBox="0 0 24 24" fill="currentColor" fill-rule="evenodd" aria-hidden="true"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 5.4a4.6 4.6 0 1 0 0 9.2 4.6 4.6 0 0 0 0-9.2zm0 1.8a2.8 2.8 0 1 1 0 5.6 2.8 2.8 0 0 1 0-5.6zm5.15-3.6a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2z"/></svg>', max: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 720"><path fill="#0a0b0b" d="M350.4,9.6C141.8,20.5,4.1,184.1,12.8,390.4c3.8,90.3,40.1,168,48.7,253.7,2.2,22.2-4.2,49.6,21.4,59.3,31.5,11.9,79.8-8.1,106.2-26.4,9-6.1,17.6-13.2,24.2-22,27.3,18.1,53.2,35.6,85.7,43.4,143.1,34.3,299.9-44.2,369.6-170.3C799.6,291.2,622.5-4.6,350.4,9.6h0ZM269.4,504c-11.3,8.8-22.2,20.8-34.7,27.7-18.1,9.7-23.7-.4-30.5-16.4-21.4-50.9-24-137.6-11.5-190.9,16.8-72.5,72.9-136.3,150-143.1,78-6.9,150.4,32.7,183.1,104.2,72.4,159.1-112.9,316.2-256.4,218.6h0Z"/></svg>', phone: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>' };
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

  function emptyContent() {
    return {
      loader: { title: clone(NATIVE_LOADER.title), subtitle: clone(NATIVE_LOADER.sub1), subtitle2: clone(NATIVE_LOADER.sub2), subtitleM: clone(NATIVE_LOADER.sub1), images: [] },
      home: { desktop: { L: null, R: null }, tablet: { L: null, R: null }, mobile: { L: null, R: null }, texts: clone(NATIVE_HOME) },
      portfolio: { about: { ru: '', en: '' }, albums: [] },
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
          price: { ru: 'от 15 000 ₽', en: 'from 15,000 ₽' },
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
    if (!base.work.cards) base.work.cards = [];
    if (!base.work.stages) base.work.stages = [];
    base.work.cards = base.work.cards.map(function (card) {
      var oldSteps = Array.isArray(card.steps) ? card.steps : [];
      var oldDescription = card.description || {};
      return {
        id: card.id || uid(),
        image: card.image || null,
        title: card.title || { ru: '', en: '' },
        price: typeof card.price === 'string' ? { ru: card.price, en: card.price } : (card.price || { ru: '', en: '' }),
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
          price: { ru: item[2] || '', en: item[3] || item[2] || '' },
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
    return fetch(API + path, options).then(function (response) {
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
    $('#draftState').textContent = 'Есть неопубликованные изменения';
    $('#draftState').classList.add('changed');
    renderNav();
  }

  function clearDirty() {
    dirtySections = {};
    $('#draftState').textContent = 'Все изменения сохранены';
    $('#draftState').classList.remove('changed');
    renderNav();
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
    return n < 1048576 ? Math.max(1, Math.round(n / 1024)) + ' КБ' : (n / 1048576).toFixed(1).replace('.', ',') + ' МБ';
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

  function mediaTile(image, index, coverIndex) {
    var size = fmtSize(image.size);
    return '<article class="media-tile ' + (index === coverIndex ? 'is-cover' : '') + '" title="' + esc(image.name || '') + '">' +
      '<img src="' + esc(image.url) + '" alt="' + esc(image.name || 'Загруженная фотография') + '" title="' + esc(image.name || '') + '">' +
      '<button class="tile-del" type="button" data-remove="' + index + '" title="Удалить" aria-label="Удалить">&minus;</button>' +
      '<div class="tile-meta"><span class="tile-name" title="' + esc(image.name || '') + '">' + esc(image.name || 'Без названия') + '</span>' + (size ? '<span class="tile-size">' + size + '</span>' : '<span class="tile-size" data-lazy-size="' + esc(image.url) + '">…</span>') + '</div>' +
      '<div class="media-actions">' +
      '<button class="media-action" type="button" data-cover="' + index + '">Превью</button>' +
      '</div></article>';
  }

  function uploadTile(label, multiple, accept) {
    return '<div class="upload-tile"><button type="button" data-upload><b>＋</b>' + label + '</button></div>';
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

  function uploadFiles(files, maxFiles) {
    var list = Array.prototype.slice.call(files || []);
    if (maxFiles > 0) list = list.slice(0, maxFiles);
    list = list.filter(function (file) {
      return /^image\//i.test(file.type || '') || /\.(avif|gif|heic|heif|jpe?g|png|tiff?|webp)$/i.test(file.name || '');
    });
    if (!list.length) return Promise.reject(new Error('Перетащите фотографии, а не другие файлы.'));
    var results = [];
    var total = list.length;
    var savedTiles = null;
    function busyTiles(text) {
      if (!savedTiles) { savedTiles = []; $$('.upload-tile button, [data-home-upload]').forEach(function (b) { savedTiles.push([b, b.innerHTML]); b.disabled = true; }); }
      savedTiles.forEach(function (pair) { pair[0].innerHTML = '<b class="tile-spin">◌</b>' + text; });
    }
    function unbusyTiles() {
      if (savedTiles) savedTiles.forEach(function (pair) { pair[0].innerHTML = pair[1]; pair[0].disabled = false; });
      savedTiles = null;
    }
    var chain = Promise.resolve();
    list.forEach(function (file, fi) {
      chain = chain.then(function () {
        if (file.size > 4 * 1024 * 1024) throw new Error('Файл больше 4 МБ. Выберите версию поменьше.');
        busyTiles('Конвертирую и загружаю ' + (fi + 1) + ' из ' + total + '…');
        toast('Загружаю «' + file.name + '» — ' + (fi + 1) + ' из ' + total);
        return new Promise(function (resolve, reject) {
          var reader = new FileReader();
          reader.onload = function () { resolve(String(reader.result).split(',')[1] || ''); };
          reader.onerror = function () { reject(new Error('Не удалось прочитать файл')); };
          reader.readAsDataURL(file);
        }).then(function (data) {
          if (localPreview) {
            return { url: 'data:' + (file.type || 'image/jpeg') + ';base64,' + data, name: file.name };
          }
          return api('upload', { method: 'POST', json: { name: file.name, type: file.type, data: data } });
        }).then(function (result) {
          results.push({ id: uid(), url: result.url, name: file.name, size: result.size || file.size || 0 });
        });
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

  function renderLoader() {
    var data = draft.loader;
    var editor = $('#editor');
    editor.innerHTML =
      '<div class="panel"><div class="panel-head"><div><h2>Текст на входе</h2><p>Ниже — реальный текст сайта: сотрите и напишите свой. Заголовок на сайте всегда показывается БОЛЬШИМИ буквами. Английские поля — для версии сайта на английском (переключатель EN).</p></div></div>' +
      '<div class="field-grid">' +
      field('Заголовок · Русский', data.title.ru, 'title.ru', 'input', 'ALISA MITEROVA') +
      field('Заголовок · English', data.title.en, 'title.en', 'input', 'ALISA MITEROVA') +
      richField('Подзаголовок · Русский (Enter — перенос строки)', 'main.ru') +
      richField('Подзаголовок · English (Enter — перенос строки)', 'main.en') +
      richField('Подзаголовок для телефона · Русский (Enter — перенос строки)', 'phone.ru') +
      richField('Подзаголовок для телефона · English (Enter — перенос строки)', 'phone.en') +
      '</div></div>' +
      '<div class="panel"><div class="panel-head"><div><h2>Фотографии в центре</h2><p>Показываются в маленьком квадрате по центру экрана, кадр обрезается по центру — подойдёт любой формат. От 1 до 4 фото. На сайте кадры показываются в благородном чёрно-белом — это фирменная эстетика лоадера: любая фотография смотрится цельно и стильно. Очерёдность фотографий можно менять, просто перетаскивая кадры мышкой.</p></div></div>' +
      '<div class="upload-grid">' + data.images.map(function (image, index) { return mediaTile(image, index, -1); }).join('') +
      (data.images.length >= 4 ? '<div class="upload-tile is-full"><span><b>4 / 4</b>Достигнуто максимальное количество фотографий</span></div>' : uploadTile('Добавить фотографии', true)) + '</div></div>';
    bindFields(editor, data);
    initRichFields(editor, data);
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
      button.onclick = function () { var image = data.images[Number(button.dataset.remove)]; if (!confirm('Удалить фотографию «' + ((image && image.name) || 'без названия') + '»?')) return; data.images.splice(Number(button.dataset.remove), 1); setDirty(); renderLoader(); };
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

  function renderHome() {
    var data = draft.home;
    var editor = $('#editor');
    var labels = { desktop: 'Широкий экран', tablet: 'Ноутбук', mobile: 'Телефон' };
    var frameAspect = { desktop: '8 / 9', tablet: '4 / 5', mobile: '9 / 16' };
    editor.innerHTML =
      '<div class="panel"><div class="panel-head"><div><h2>Фотографии обложки</h2><p>Одна фотография на каждую половину — она используется на всех устройствах сразу. Пока своя не выбрана, показывается фотография, которая уже стоит на сайте.</p></div></div>' +
      '<div class="screen-pair">' + ['L', 'R'].map(function (side) {
        var image = data.photo[side];
        var url = image ? image.url : NATIVE_COVERS[side];
        return '<article class="screen-card"><h3>' + (side === 'L' ? 'Portfolio' : 'Work') + '</h3>' +
          '<div class="screen-photo" style="' + (url ? 'background-image:url(' + esc(url) + ')' : '') + '">' + (image ? '' : (url ? '<span class="ph-badge">Фото с сайта</span>' : 'Загружаем фотографию сайта…')) + '</div>' +
          '<button class="button button-light" type="button" data-home-upload="' + side + '">' + (image ? 'Заменить' : 'Выбрать свою фотографию') + '</button>' +
          (image ? '<button class="text-button" type="button" data-home-remove="' + side + '">Вернуть фото сайта</button>' : '') + '</article>';
      }).join('') + '</div></div>' +
      '<div class="panel"><div class="panel-head"><div><h2>Кадр под каждый экран</h2><p>Миниатюра выбирается отдельно для широкого экрана, ноутбука и телефона. Фотография одна и та же — меняется только видимая часть кадра.</p></div></div>' +
      '<div class="screen-tabs">' + ['desktop', 'tablet', 'mobile'].map(function (mode) {
        return '<button type="button" data-screen="' + mode + '" class="' + (mode === screenMode ? 'is-active' : '') + '">' + labels[mode] + '</button>';
      }).join('') + '</div>' +
      '<div class="screen-pair">' + ['L', 'R'].map(function (side) {
        var image = data.photo[side];
        var url = image ? image.url : NATIVE_COVERS[side];
        var pos = data.pos[screenMode][side];
        return '<article class="screen-card"><h3>' + (side === 'L' ? 'Portfolio' : 'Work') + '</h3>' +
          '<div class="frame-box" data-frame="' + side + '" style="aspect-ratio:' + frameAspect[screenMode] + ';' + (url ? 'background-image:url(' + esc(url) + ');background-position:' + pos.x + '% ' + pos.y + '%;' : '') + '">' + (url ? '' : 'Сначала выберите фотографию') + '</div>' +
          '<button class="text-button" type="button" data-frame-reset="' + side + '">По центру</button></article>';
      }).join('') + '</div><p class="help">Зажмите кадр мышкой и двигайте — так вы выбираете, какая часть фотографии видна на этом устройстве.</p></div>' +
      '<div class="panel"><div class="panel-head"><div><h2>Заголовки и подписи</h2><p>Это реальные тексты главной страницы — сотрите и напишите свои. Русские поля слева, английские справа — для английской версии сайта. Перенос строки — клавиша Enter.</p></div></div><div class="field-grid">' +
      field('Надзаголовок над PORTFOLIO · Русский', data.texts.tagL.ru, 'texts.tagL.ru', 'textarea', '') +
      field('Надзаголовок над PORTFOLIO · English', data.texts.tagL.en, 'texts.tagL.en', 'textarea', '') +
      field('Подпись под PORTFOLIO · Русский', data.texts.smallL.ru, 'texts.smallL.ru', 'textarea', '') +
      field('Подпись под PORTFOLIO · English', data.texts.smallL.en, 'texts.smallL.en', 'textarea', '') +
      field('Подзаголовок PORTFOLIO (внизу) · Русский', data.texts.subL.ru, 'texts.subL.ru', 'textarea', '') +
      field('Подзаголовок PORTFOLIO (внизу) · English', data.texts.subL.en, 'texts.subL.en', 'textarea', '') +
      field('Подзаголовок WORK (внизу) · Русский', data.texts.subR.ru, 'texts.subR.ru', 'textarea', '') +
      field('Подзаголовок WORK (внизу) · English', data.texts.subR.en, 'texts.subR.en', 'textarea', '') +
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
    $$('.frame-box', editor).forEach(function (box) {
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

  function renderPortfolio() {
    var data = draft.portfolio;
    var editor = $('#editor');
    editor.innerHTML =
      '<div class="panel"><div class="panel-head"><div><h2>О себе</h2><p>Небольшой живой текст — достаточно двух или трёх предложений.</p></div></div><div class="field-grid">' +
      field('Русский', data.about.ru, 'about.ru', 'textarea', 'Расскажите о себе и своём подходе') +
      field('English', data.about.en, 'about.en', 'textarea', 'Tell visitors about your approach') +
      '</div></div>' +
      '<div class="panel"><div class="panel-head"><div><h2>Альбомы</h2><p>Первый кадр с отметкой «Превью» будет обложкой подраздела.</p></div><button id="addAlbum" class="button button-light" type="button">Добавить альбом</button></div>' +
      '<div class="album-list">' + (data.albums.length ? data.albums.map(albumCard).join('') : emptyBlock('Альбомов пока нет', 'Добавьте первый альбом и загрузите фотографии.', 'Создать альбом', 'emptyAlbum')) + '</div></div>';
    bindFields(editor, data);
    var add = function () {
      data.albums.push({ id: uid(), title: { ru: 'Новый альбом', en: 'New album' }, previewId: '', photos: [] });
      setDirty(); renderPortfolio();
      var cards = $$('.item-card', editor); if (cards.length) cards[cards.length - 1].classList.add('is-open');
    };
    $('#addAlbum').onclick = add;
    var emptyButton = $('#emptyAlbum'); if (emptyButton) emptyButton.onclick = add;
    bindAlbumCards();
  }

  function albumCard(album, albumIndex) {
    var coverIndex = album.photos.map(function (x) { return x.id; }).indexOf(album.previewId);
    var cover = coverIndex >= 0 ? album.photos[coverIndex] : album.photos[0];
    return '<article class="item-card" data-album="' + albumIndex + '">' +
      '<button class="item-summary" type="button" data-toggle><span class="item-thumb" style="' + (cover ? 'background-image:url(' + esc(cover.url) + ')' : '') + '"></span>' +
      '<span><b>' + esc(album.title.ru || 'Без названия') + '</b><small>' + album.photos.length + ' фото</small></span><span class="chevron"></span></button>' +
      '<div class="item-body"><div class="field-grid">' +
      field('Название', album.title.ru, 'album.title.ru', 'input', 'Название альбома') +
      field('Title · English', album.title.en, 'album.title.en', 'input', 'Album title') + '</div>' +
      '<div class="divider"></div><div class="upload-grid">' +
      album.photos.map(function (photo, index) { return mediaTile(photo, index, coverIndex < 0 ? 0 : coverIndex); }).join('') + uploadTile('Перетащить или выбрать фото', true) + '</div>' +
      '<div class="row-actions"><button class="button button-danger" type="button" data-delete-album>Удалить альбом</button></div></div></article>';
  }

  function bindAlbumCards() {
    $$('.item-card[data-album]', $('#editor')).forEach(function (card) {
      var albumIndex = Number(card.dataset.album);
      var album = draft.portfolio.albums[albumIndex];
      $('[data-toggle]', card).onclick = function () { card.classList.toggle('is-open'); };
      $$('[data-bind]', card).forEach(function (input) {
        input.oninput = function () {
          if (input.dataset.bind.indexOf('.ru') > -1) album.title.ru = input.value;
          else album.title.en = input.value;
          setDirty('portfolio');
        };
      });
      var addImages = function (images) {
        album.photos = album.photos.concat(images).slice(0, 80);
        if (!album.previewId && album.photos[0]) album.previewId = album.photos[0].id;
        setDirty('portfolio'); renderPortfolio();
      };
      var remaining = Math.max(0, 80 - album.photos.length);
      $('[data-upload]', card).onclick = function () {
        if (!remaining) return toast('В одном альбоме может быть до 80 фотографий.');
        chooseFiles({ multiple: true, max: remaining }, addImages);
      };
      bindDropZone($('.upload-tile', card), addImages, remaining);
      $$('[data-cover]', card).forEach(function (button) {
        button.onclick = function () { album.previewId = album.photos[Number(button.dataset.cover)].id; setDirty('portfolio'); renderPortfolio(); };
      });
      $$('[data-remove]', card).forEach(function (button) {
        button.onclick = function () {
          var delIndex = Number(button.dataset.remove); var delTarget = album.photos[delIndex]; if (!confirm('Удалить фотографию «' + ((delTarget && delTarget.name) || 'без названия') + '»?')) return; var removed = album.photos.splice(delIndex, 1)[0];
          if (removed && removed.id === album.previewId) album.previewId = album.photos[0] ? album.photos[0].id : '';
          setDirty('portfolio'); renderPortfolio();
        };
      });
      $('[data-delete-album]', card).onclick = function () { draft.portfolio.albums.splice(albumIndex, 1); setDirty('portfolio'); renderPortfolio(); };
    });
  }

  function renderWork() {
    var work = draft.work;
    var cards = work.cards;
    var editor = $('#editor');
    editor.innerHTML = '<div class="panel"><div class="panel-head"><div><h2>Карточки и этапы</h2><p>В карточке можно указать услугу, цену и порядок работы.</p></div><button id="addWork" class="button button-light" type="button">Добавить карточку</button></div>' +
      '<div class="card-list">' + (cards.length ? cards.map(workCard).join('') : emptyBlock('Карточек пока нет', 'Создайте услугу, добавьте фотографию и перечислите, что входит.', 'Создать карточку', 'emptyWork')) + '</div></div>' +
      '<div class="panel"><div class="panel-head"><div><h2>Этапы съёмки</h2><p>Этот порядок показывается под карточками услуг — от первой заявки до готовых фотографий.</p></div><button id="addStage" class="button button-light" type="button">Добавить этап</button></div>' +
      '<div class="steps">' + work.stages.map(workStageRow).join('') + '</div></div>';
    var add = function () {
      cards.push({ id: uid(), image: null, title: { ru: 'Новая услуга', en: 'New service' }, price: { ru: '', en: '' }, features: { ru: [], en: [] } });
      setDirty(); renderWork();
      var all = $$('.item-card', editor); if (all.length) all[all.length - 1].classList.add('is-open');
    };
    $('#addWork').onclick = add;
    var emptyButton = $('#emptyWork'); if (emptyButton) emptyButton.onclick = add;
    $('#addStage').onclick = function () {
      work.stages.push({ id: uid(), title: { ru: '', en: '' }, text: { ru: '', en: '' } });
      setDirty('work'); renderWork();
    };
    bindWorkCards();
    bindWorkStages();
  }

  function workCard(card, cardIndex) {
    var featureRu = (card.features && card.features.ru || []).join('\n');
    var featureEn = (card.features && card.features.en || []).join('\n');
    return '<article class="item-card" data-work="' + cardIndex + '"><button class="item-summary" type="button" data-toggle>' +
      '<span class="item-thumb" style="' + (card.image ? 'background-image:url(' + esc(card.image.url) + ')' : '') + '"></span><span><b>' + esc(card.title.ru || 'Без названия') + '</b><small>' + esc(card.price.ru || 'Цена не указана') + '</small></span><span class="chevron"></span></button>' +
      '<div class="item-body"><div class="field-grid">' +
      field('Название', card.title.ru, 'title.ru', 'input', 'Портретная съёмка') +
      field('Title · English', card.title.en, 'title.en', 'input', 'Portrait session') + '</div>' +
      '<div class="field-grid" style="margin-top:14px">' +
      field('Стоимость', card.price.ru, 'price.ru', 'input', 'от 15 000 ₽') +
      field('Price · English', card.price.en, 'price.en', 'input', 'from 15,000 ₽') + '</div>' +
      '<div class="field-grid" style="margin-top:14px">' +
      field('Что входит · каждый пункт с новой строки', featureRu, 'features.ru', 'textarea', 'Два часа съёмки\nПомощь с образом') +
      field('Included · one item per line', featureEn, 'features.en', 'textarea', 'Two-hour session\nStyling guidance') + '</div>' +
      '<div class="divider"></div><div class="screen-card"><h3>Фотография карточки</h3><div class="screen-photo" style="' + (card.image ? 'background-image:url(' + esc(card.image.url) + ')' : '') + '">' + (card.image ? '' : 'Фотография не выбрана') + '</div>' +
      '<button class="button button-light" type="button" data-work-image>' + (card.image ? 'Заменить' : 'Выбрать фотографию') + '</button></div>' +
      '<div class="row-actions"><button class="button button-danger" type="button" data-delete-work>Удалить карточку</button></div></div></article>';
  }

  function bindWorkCards() {
    $$('.item-card[data-work]', $('#editor')).forEach(function (root) {
      var cardIndex = Number(root.dataset.work);
      var card = draft.work.cards[cardIndex];
      $('[data-toggle]', root).onclick = function () { root.classList.toggle('is-open'); };
      $$('[data-bind]', root).forEach(function (input) {
        input.oninput = function () {
          var path = input.dataset.bind.split('.');
          if (path[0] === 'features') {
            card.features[path[1]] = input.value.split(/\n/).map(function (line) { return line.trim(); }).filter(Boolean);
          } else {
            card[path[0]][path[1]] = input.value;
          }
          setDirty('work');
        };
      });
      $('[data-work-image]', root).onclick = function () {
        chooseFiles({ multiple: false }, function (images) { card.image = images[0]; setDirty('work'); renderWork(); });
      };
      $('[data-delete-work]', root).onclick = function () { draft.work.cards.splice(cardIndex, 1); setDirty('work'); renderWork(); };
    });
  }

  function workStageRow(stage, index) {
    return '<article class="item-card is-open" data-work-stage="' + index + '"><div class="item-body" style="display:block;padding-top:18px">' +
      '<div class="field-grid">' +
      field('Название этапа', stage.title.ru, 'stage.title.ru', 'input', 'Подготовка') +
      field('Stage title · English', stage.title.en, 'stage.title.en', 'input', 'Preparation') + '</div>' +
      '<div class="field-grid" style="margin-top:14px">' +
      field('Короткое пояснение', stage.text.ru, 'stage.text.ru', 'input', 'Собираем образы и референсы') +
      field('Description · English', stage.text.en, 'stage.text.en', 'input', 'We prepare looks and references') + '</div>' +
      '<div class="row-actions"><button class="button button-danger" type="button" data-delete-work-stage>Удалить этап</button></div></div></article>';
  }

  function bindWorkStages() {
    $$('[data-work-stage]', $('#editor')).forEach(function (root) {
      var index = Number(root.dataset.workStage);
      var stage = draft.work.stages[index];
      $$('[data-bind]', root).forEach(function (input) {
        input.oninput = function () {
          var lang = input.dataset.bind.split('.').pop();
          if (input.dataset.bind.indexOf('title') > -1) stage.title[lang] = input.value;
          else stage.text[lang] = input.value;
          setDirty('work');
        };
      });
      $('[data-delete-work-stage]', root).onclick = function () {
        draft.work.stages.splice(index, 1);
        setDirty('work'); renderWork();
      };
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
      '<div class="panel"><div class="panel-head"><div><h2>Контакты</h2><p>Плашки такие же, как на сайте. Меняется только ссылка (у телефона — номер): подпись и тег подстроятся сами.</p></div></div>' +
      '<div class="ct-admin-grid">' + contacts.map(function (c, i) {
        return '<div class="ct-card"><div class="ct-card-head">' + CONTACT_ICONS[c.type] + '<div class="cc-t"><span class="cc-l">' + esc(c.label) + '</span><span class="cc-s" data-ct-sub="' + i + '">' + esc(c.value) + '</span></div></div>' +
          '<label class="field"><span>' + (c.type === 'phone' ? 'Номер телефона' : 'Ссылка') + '</span><input data-ct-link="' + i + '" value="' + esc(c.type === 'phone' ? c.value : c.href) + '" placeholder="' + (c.type === 'phone' ? '+7 900 000-00-00' : 'https://…') + '"></label></div>';
      }).join('') + '</div>' +
      '<p class="help">Если очистить поле — плашка не будет показываться на сайте.</p></div>' +
      '<div class="panel"><div class="panel-head"><div><h2>Вопросы и ответы (FAQ)</h2><p>Это реальные вопросы с сайта — отредактируйте или напишите свои. Русские поля слева, английские справа.</p></div><button id="addFaq" class="button button-light" type="button">Добавить вопрос</button></div>' +
      '<div id="faqRows">' + faq.map(function (f, i) {
        return '<div class="faq-admin-item"><div class="faq-admin-head"><span class="faq-head-left"><span class="faq-drag" title="Перетащите, чтобы поменять порядок">⣿</span><b>Вопрос ' + (i + 1) + '</b></span><button type="button" class="text-button" data-faq-del="' + i + '">Удалить</button></div><div class="field-grid">' +
          '<label class="field"><span>Вопрос · Русский</span><textarea data-faq="' + i + '.q.ru">' + esc(f.q.ru) + '</textarea></label>' +
          '<label class="field"><span>Вопрос · English</span><textarea data-faq="' + i + '.q.en">' + esc(f.q.en) + '</textarea></label>' +
          '<label class="field"><span>Ответ · Русский</span><textarea data-faq="' + i + '.a.ru">' + esc(f.a.ru) + '</textarea></label>' +
          '<label class="field"><span>Ответ · English</span><textarea data-faq="' + i + '.a.en">' + esc(f.a.en) + '</textarea></label>' +
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
        if (!confirm('Удалить вопрос «' + ((faq[i].q.ru || faq[i].q.en || '') + '').slice(0, 60) + '»?')) return;
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

  function renderPreview() {
    var frame = $('#previewFrame');
    frame.className = 'preview-frame ' + device;
    var nav = '<div class="pv-nav"><b>Alisa Miterova</b><span>PORTFOLIO&nbsp;&nbsp;&nbsp; WORK&nbsp;&nbsp;&nbsp; КОНТАКТЫ</span></div>';
    if (active === 'loader') {
      frame.innerHTML = '<div class="pv-loading">Загружаем настоящий лоадер…</div>';
      api('preview-content', { method: 'POST', json: draft }).then(function (result) {
        if (active !== 'loader' || $('#previewModal').classList.contains('is-hidden')) return;
        try { sessionStorage.setItem('cmsPreviewContent', JSON.stringify(result.content || {})); } catch (e) {}
        frame.classList.add('is-live');
        frame.innerHTML = '<div class="pv-langbar"><button type="button"' + (previewLang === 'ru' ? ' class="is-on"' : '') + ' data-pvlang="ru">RU</button><button type="button"' + (previewLang === 'en' ? ' class="is-on"' : '') + ' data-pvlang="en">EN</button><button type="button" data-pvreplay title="Воспроизвести снова" aria-label="Воспроизвести снова">⟳</button></div>' +
          '<div class="pv-scale"><iframe class="pv-iframe" src="/?cmsPreview=1&cmsLoaderLoop=1&cmsLang=' + previewLang + '&t=' + Date.now() + '" title="Предпросмотр сайта"></iframe></div>';
        $$('[data-pvlang]', frame).forEach(function (b) { b.onclick = function () { previewLang = b.getAttribute('data-pvlang'); renderPreview(); }; });
        $('[data-pvreplay]', frame).onclick = function () { var f = $('.pv-iframe', frame); if (f) f.src = '/?cmsPreview=1&cmsLoaderLoop=1&cmsLang=' + previewLang + '&t=' + Date.now(); };
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
        frame.innerHTML = '<div class="pv-langbar"><button type="button"' + (previewLang === 'ru' ? ' class="is-on"' : '') + ' data-pvlang="ru">RU</button><button type="button"' + (previewLang === 'en' ? ' class="is-on"' : '') + ' data-pvlang="en">EN</button></div>' +
          '<div class="pv-scale"><iframe class="pv-iframe" src="/?cmsPreview=1&cmsHome=1&cmsLang=' + previewLang + '&t=' + Date.now() + '" title="Предпросмотр главной"></iframe></div>';
        $$('[data-pvlang]', frame).forEach(function (b) { b.onclick = function () { previewLang = b.getAttribute('data-pvlang'); renderPreview(); }; });
        fitPreviewScale(frame);
      }).catch(function (error) {
        frame.innerHTML = '<div class="pv-loading">Не удалось открыть предпросмотр: ' + esc(error.message) + '</div>';
      });
    }
    if (active === 'portfolio') {
      frame.innerHTML = '<div class="pv-site">' + nav + '<section class="pv-portfolio"><header class="pv-heading"><h2>Portfolio</h2><p>' + esc(draft.portfolio.about.ru || 'Здесь появится ваш текст о себе.') + '</p></header><div class="pv-albums">' +
        draft.portfolio.albums.map(function (album) {
          var image = album.photos.filter(function (x) { return x.id === album.previewId; })[0] || album.photos[0];
          return '<article class="pv-album" style="' + (image ? 'background-image:url(' + esc(image.url) + ')' : '') + '"><b>' + esc(album.title.ru) + '</b></article>';
        }).join('') + '</div></section></div>';
    }
    if (active === 'work') {
      frame.innerHTML = '<div class="pv-site">' + nav + '<section class="pv-work"><header class="pv-heading"><h2>Work</h2></header><div class="pv-work-list">' +
        draft.work.cards.map(function (card) {
          return '<article class="pv-work-card"><div><h3>' + esc(card.title.ru) + '</h3><p>' + esc((card.features.ru || []).join(' · ')) + '</p></div><strong>' + esc(card.price.ru) + '</strong></article>';
        }).join('') + '</div><div class="pv-steps" style="margin-top:28px">' +
        draft.work.stages.map(function (stage, i) { return '<span class="pv-step"><b>0' + (i + 1) + ' · ' + esc(stage.title.ru) + '</b>' + esc(stage.text.ru) + '</span>'; }).join('') +
        '</div></section></div>';
    }
    if (active === 'contacts') {
      frame.innerHTML = '<div class="pv-loading">Загружаем раздел Контакты…</div>';
      api('preview-content', { method: 'POST', json: draft }).then(function (result) {
        if (active !== 'contacts' || $('#previewModal').classList.contains('is-hidden')) return;
        try { sessionStorage.setItem('cmsPreviewContent', JSON.stringify(result.content || {})); } catch (e) {}
        frame.classList.add('is-live');
        frame.innerHTML = '<div class="pv-langbar"><button type="button"' + (previewLang === 'ru' ? ' class="is-on"' : '') + ' data-pvlang="ru">RU</button><button type="button"' + (previewLang === 'en' ? ' class="is-on"' : '') + ' data-pvlang="en">EN</button></div>' +
          '<div class="pv-scale"><iframe class="pv-iframe" src="/?cmsPreview=1&cmsHome=1&cmsSec=ct&cmsLang=' + previewLang + '&t=' + Date.now() + '" title="Предпросмотр контактов"></iframe></div>';
        $$('[data-pvlang]', frame).forEach(function (b) { b.onclick = function () { previewLang = b.getAttribute('data-pvlang'); renderPreview(); }; });
        fitPreviewScale(frame);
      }).catch(function (error) {
        frame.innerHTML = '<div class="pv-loading">Не удалось открыть предпросмотр: ' + esc(error.message) + '</div>';
      });
    }
  }

  function openPreview() { renderPreview(); $('#previewModal').classList.remove('is-hidden'); document.body.style.overflow = 'hidden'; }
  function closePreview() { $('#previewModal').classList.add('is-hidden'); document.body.style.overflow = ''; }
  function askPublish() { closePreview(); $('#confirmModal').classList.remove('is-hidden'); }
  function closeConfirm() { $('#confirmModal').classList.add('is-hidden'); }

  function publish() {
    $('#confirmPublish').disabled = true;
    $('#publish').disabled = true;
    api('admin-content', { method: 'PUT', json: draft }).then(function (result) {
      saved = clone(result.content || draft);
      draft = normalize(clone(saved));
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
    saved = normalize(state.content && state.content.admin ? state.content.admin : state.content);
    draft = clone(saved);
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
      if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(link).then(function () { toast('Ссылка скопирована. Она действует 15 минут.'); });
      window.prompt('Скопируйте ссылку. Она действует 15 минут:', link);
    }).catch(function (error) { toast(error.message); });
  };
  $('#menuToggle').onclick = function () {
    var open = document.body.classList.toggle('menu-open');
    this.setAttribute('aria-expanded', String(open));
  };
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
  $('#cancelPublish').onclick = closeConfirm;
  $('#confirmPublish').onclick = publish;
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') { closePreview(); closeConfirm(); document.body.classList.remove('menu-open'); }
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

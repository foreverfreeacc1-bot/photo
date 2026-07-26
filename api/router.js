/* ============================================================
   Alisa Miterova — CMS API (Vercel Serverless Function)
   Все запросы /api/* приходят сюда через rewrite (см. vercel.json).
   Хранение: Supabase Storage — контент cms/content.json, фото cms/<uuid>.<ext>
   Локальные команды (нужен Node 18+):
     node api/router.js hash "пароль"  → строка ADMIN_PASSWORD_HASH
     node api/router.js secret          → строка SESSION_SECRET
   ============================================================ */
'use strict';
const crypto = require('crypto');
let sharp = null;
try { sharp = require('sharp'); } catch (e) { sharp = null; }
const fsLocal = require('fs');
const pathLocal = require('path');
const LOCAL_STORE = process.env.CMS_LOCAL === '1';
const LOCAL_DIR = process.env.CMS_LOCAL_DIR || pathLocal.join(process.cwd(), '.local-cms');

const SB_URL = String(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '');
const SB_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const BUCKET = process.env.PHOTOS_BUCKET || process.env.NEXT_PUBLIC_PHOTOS_BUCKET || 'photos';
const ADMIN_USER = String(process.env.ADMIN_USER || '').trim();
const PASS_HASH = String(process.env.ADMIN_PASSWORD_HASH || '').trim();
/* Cloudflare R2 (S3-совместимое хранилище). Если заданы все R2_* переменные — используется R2, иначе Supabase. */
const R2_ACCOUNT_ID = String(process.env.R2_ACCOUNT_ID || '').trim();
const R2_ACCESS_KEY_ID = String(process.env.R2_ACCESS_KEY_ID || '').trim();
const R2_SECRET_ACCESS_KEY = String(process.env.R2_SECRET_ACCESS_KEY || '').trim();
const R2_BUCKET = String(process.env.R2_BUCKET || 'photos').trim();
const R2_PUBLIC_BASE_URL = String(process.env.R2_PUBLIC_BASE_URL || process.env.R2_PUBLIC_BASE || '').trim().replace(/\/+$/, '');
const USE_R2 = !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY);
/* SESSION_SECRET необязателен: если не задан, секрет выводится из ADMIN_PASSWORD_HASH + ключа хранилища */
const SECRET = String(process.env.SESSION_SECRET || '').trim() || (PASS_HASH ? crypto.createHash('sha256').update('cms.secret.v1.' + PASS_HASH + '.' + (SB_KEY || R2_SECRET_ACCESS_KEY)).digest('hex') : '');
const TTL = 12 * 60 * 60 * 1000;
/* Фото отдаются через собственный домен (/api/img/...) — публичный доступ R2 не нужен */
const PUB_BASE = (LOCAL_STORE || USE_R2) ? '/api/img/' : SB_URL + '/storage/v1/object/public/' + BUCKET + '/cms/';

/* ---------- слоты редактируемых текстов (белый список — защита от IDOR) ---------- */
const SLOTS = [
  { id: 'brand', sel: '#brand', label: 'Логотип в шапке (ALISA MITEROVA)' },
  { id: 'galCaption', sel: '.gal-caption', label: 'Подпись «Выберите раздел»' },
  { id: 'ctag', sel: '#ctL .ctag', label: 'Надпись КОЛЛЕКЦИЯ (PORTFOLIO)' },
  { id: 'ct1i', sel: '#ctL .ct1i', label: 'Подзаголовок Selected works' },
  { id: 'ctL2', sel: '#ctL .ct2', label: 'Описание PORTFOLIO (основное)' },
  { id: 'cfL2', sel: '#cfL .ct2', label: 'Описание PORTFOLIO (при наведении)' },
  { id: 'cfR2', sel: '#cfR .ct2', label: 'Описание WORK (при наведении)' },
  { id: 'tick', sel: '.tickin', label: 'Бегущая строка WORK (один сегмент, в конце « · »)', rep: 8 },
  { id: 'mpiPf', sel: '.mpi[data-sec="pf"]', label: 'Меню: пункт Portfolio' },
  { id: 'mpiWk', sel: '.mpi[data-sec="wk"]', label: 'Меню: пункт Work' },
  { id: 'mpiCt', sel: '.mpi[data-sec="ct"]', label: 'Меню: пункт Контакты' },
  { id: 'ntabPf', sel: '.ntab[data-sec="pf"]', label: 'Навбар: вкладка Portfolio' },
  { id: 'ntabWk', sel: '.ntab[data-sec="wk"]', label: 'Навбар: вкладка Work' },
  { id: 'ntabCt', sel: '.ntab[data-sec="ct"]', label: 'Навбар: вкладка Контакты' },
  { id: 'svBack', sel: '.sv-bl', label: 'Кнопка НАЗАД в разделах' }
];

/* ---------- утилиты ---------- */
function hmac(s) { return crypto.createHmac('sha256', SECRET).update(String(s)).digest('hex'); }
function safeEq(a, b) { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); }
function clean(s, max) { return String(s == null ? '' : s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').slice(0, max || 2000).trim(); }
function cleanSel(s) { s = clean(s, 120); return /^[-a-zA-Z0-9 .#_>:,()\[\]="']+$/.test(s) ? s : ''; }
function validPos(p) { return typeof p === 'string' && /^\d{1,3}% \d{1,3}%$/.test(p); }
function validUploadUrl(u) { return typeof u === 'string' && u.indexOf(PUB_BASE) === 0 && /^[a-f0-9-]{36}\.(jpg|png|webp|avif)$/.test(u.slice(PUB_BASE.length)); }
function normUploadUrl(u) { if (typeof u !== 'string') return u; if (USE_R2 && R2_PUBLIC_BASE_URL && u.indexOf(R2_PUBLIC_BASE_URL + '/cms/') === 0) return '/api/img/' + u.slice((R2_PUBLIC_BASE_URL + '/cms/').length); return u; }
function fileNames(o) { const m = (JSON.stringify(o) || '').match(/[a-f0-9-]{36}\.(?:jpg|png|webp|avif)/g); return new Set(m || []); }
function validHref(h) { return typeof h === 'string' && h.length <= 300 && /^(https?:\/\/|tel:|mailto:)[^\s"'<>]+$/i.test(h); }
function defaults() { return { texts: {}, custom: [], rsub: null, title: null, covers: {}, gallery: [], secs: null, contacts: [], admin: null }; }

function cleanLangPair(v, max) {
  return { ru: clean(v && v.ru, max), en: clean(v && v.en, max) };
}
function validExtImgUrl(h) { return typeof h === 'string' && h.length <= 600 && (/^https:\/\/[^\s"'<>]+$/i.test(h) || /^\/img\/[a-zA-Z0-9._\/-]{1,120}\.(jpg|jpeg|png|webp|avif)$/i.test(h)); }
function cleanImage(v) {
  const u = v ? normUploadUrl(v.url) : null;
  if (!v || !(validUploadUrl(u) || validExtImgUrl(u))) return null;
  return {
    id: (typeof v.id === 'string' && /^[a-f0-9-]{36}$/.test(v.id)) ? v.id : crypto.randomUUID(),
    url: u,
    name: clean(v.name, 100),
    size: (typeof v.size === 'number' && isFinite(v.size) && v.size > 0) ? Math.min(Math.round(v.size), 99000000) : 0
  };
}
function cleanImages(v, limit) {
  return (Array.isArray(v) ? v.slice(0, limit) : []).map(cleanImage).filter(Boolean);
}
const ICON_KEYS_OK = ['camera', 'image', 'book', 'gem', 'star', 'heart', 'pin', 'sun', 'clock', 'check'];
function cleanIcon(v) { return ICON_KEYS_OK.indexOf(v) >= 0 ? v : 'camera'; }
function cleanAboutStages(v) {
  return (Array.isArray(v) ? v.slice(0, 12) : []).map(function (st) {
    return {
      id: (st && typeof st.id === 'string' && /^[a-f0-9-]{36}$/.test(st.id)) ? st.id : crypto.randomUUID(),
      icon: cleanIcon(st && st.icon),
      iconImage: cleanImage(st && st.iconImage),
      title: cleanLangPair(st && st.title, 200),
      text: cleanLangPair(st && st.text, 2000)
    };
  }).filter(function (st) { return st.title.ru || st.title.en || st.text.ru || st.text.en; });
}
function cleanAboutBlock(v) {
  v = v && typeof v === 'object' ? v : {};
  return {
    title: cleanLangPair(v.title, 120),
    name: cleanLangPair(v.name, 200),
    text: cleanLangPair(v.text, 4000),
    stages: cleanAboutStages(v.stages)
  };
}
function sanitizeAdmin(v) {
  v = v && typeof v === 'object' ? v : {};
  const loader = v.loader || {};
  const home = v.home || {};
  const portfolio = v.portfolio || {};
  const work = v.work || {};
  const out = {
    loader: {
      title: cleanLangPair(loader.title, 120),
      subtitle: cleanLangPair(loader.subtitle, 300),
      subtitle2: cleanLangPair(loader.subtitle2, 300),
      subtitleM: cleanLangPair(loader.subtitleM, 300),
      images: cleanImages(loader.images, 4)
    },
    home: {},
    portfolio: {
      about: cleanLangPair(portfolio.about, 4000),
      intro: cleanLangPair(portfolio.intro, 1000),
      aboutBlock: cleanAboutBlock(portfolio.aboutBlock),
      albums: []
    },
    work: {
      cards: [],
      stages: [],
      stagesHead: {
        title: cleanLangPair(work.stagesHead && work.stagesHead.title, 120),
        sub: cleanLangPair(work.stagesHead && work.stagesHead.sub, 300)
      }
    },
    contacts: []
  };
  ['desktop', 'tablet', 'mobile'].forEach(function (mode) {
    const item = home[mode] || {};
    out.home[mode] = { L: cleanImage(item.L), R: cleanImage(item.R) };
  });
  out.home.pos = {};
  ['desktop', 'tablet', 'mobile'].forEach(function (mode) {
    const pm = (home.pos && home.pos[mode]) || {};
    out.home.pos[mode] = {};
    ['L', 'R'].forEach(function (side) {
      const p = pm[side];
      if (p && isFinite(p.x) && isFinite(p.y)) {
        out.home.pos[mode][side] = { x: Math.min(100, Math.max(0, Math.round(Number(p.x)))), y: Math.min(100, Math.max(0, Math.round(Number(p.y)))) };
      }
    });
  });
  const homeTexts = home.texts || {};
  out.home.texts = {
    tagL: cleanLangPair(homeTexts.tagL, 120),
    smallL: cleanLangPair(homeTexts.smallL, 200),
    subL: cleanLangPair(homeTexts.subL, 500),
    subR: cleanLangPair(homeTexts.subR, 500)
  };
  out.portfolio.albums = (Array.isArray(portfolio.albums) ? portfolio.albums.slice(0, 12) : []).map(function (album) {
    const photos = cleanImages(album && album.photos, 80);
    const preview = clean(album && album.previewId, 40);
    return {
      id: (album && typeof album.id === 'string' && /^[a-f0-9-]{36}$/.test(album.id)) ? album.id : crypto.randomUUID(),
      title: cleanLangPair(album && album.title, 120),
      desc: cleanLangPair(album && album.desc, 600),
      previewId: photos.some(function (photo) { return photo.id === preview; }) ? preview : (photos[0] ? photos[0].id : ''),
      photos: photos
    };
  });
  out.work.cards = (Array.isArray(work.cards) ? work.cards.slice(0, 12) : []).map(function (card) {
    const oldDescription = cleanLangPair(card && card.description, 1000);
    const oldSteps = Array.isArray(card && card.steps) ? card.steps : [];
    const features = card && card.features || {};
    return {
      id: (card && typeof card.id === 'string' && /^[a-f0-9-]{36}$/.test(card.id)) ? card.id : crypto.randomUUID(),
      image: cleanImage(card && card.image),
      title: cleanLangPair(card && card.title, 120),
      price: typeof (card && card.price) === 'string'
        ? { ru: clean(card.price, 80), en: clean(card.price, 80) }
        : cleanLangPair(card && card.price, 80),
      features: {
        ru: (Array.isArray(features.ru) ? features.ru : (oldSteps.length ? oldSteps.map(function (step) { return [step.title, step.text].filter(Boolean).join(' — '); }) : (oldDescription.ru ? [oldDescription.ru] : []))).slice(0, 12).map(function (line) { return clean(line, 220); }).filter(Boolean),
        en: (Array.isArray(features.en) ? features.en : (oldSteps.length ? oldSteps.map(function (step) { return [step.title, step.text].filter(Boolean).join(' — '); }) : (oldDescription.en ? [oldDescription.en] : []))).slice(0, 12).map(function (line) { return clean(line, 220); }).filter(Boolean)
      }
    };
  });
  out.work.stages = (Array.isArray(work.stages) ? work.stages.slice(0, 8) : []).map(function (stage, i) {
    const badge = cleanLangPair(stage && stage.badge, 60);
    if (!badge.ru) badge.ru = '\u0428\u0430\u0433 ' + (i + 1);
    if (!badge.en) badge.en = 'Step ' + (i + 1);
    return {
      id: (stage && typeof stage.id === 'string' && /^[a-f0-9-]{36}$/.test(stage.id)) ? stage.id : crypto.randomUUID(),
      icon: cleanIcon(stage && stage.icon),
      badge: badge,
      title: cleanLangPair(stage && stage.title, 100),
      text: cleanLangPair(stage && stage.text, 300)
    };
  });
  const iconMap = { telegram: 'tg', instagram: 'ig', max: 'mx', phone: 'ph', email: 'ph', website: 'ph' };
  out.contacts = (Array.isArray(v.contacts) ? v.contacts.slice(0, 10) : []).map(function (contact) {
    const type = ['telegram', 'instagram', 'max', 'phone', 'email', 'website'].indexOf(contact && contact.type) >= 0 ? contact.type : 'website';
    const href = validHref(contact && contact.href) ? contact.href : '';
    return {
      id: (contact && typeof contact.id === 'string' && /^[a-f0-9-]{36}$/.test(contact.id)) ? contact.id : crypto.randomUUID(),
      type: type,
      icon: iconMap[type],
      label: clean(contact && contact.label, 60),
      value: clean(contact && contact.value, 120),
      href: href
    };
  }).filter(function (contact) { return contact.label && contact.href; });
  out.faq = (Array.isArray(v.faq) ? v.faq.slice(0, 20) : []).map(function (item) {
    return {
      id: (item && typeof item.id === 'string' && /^[a-zA-Z0-9-]{1,40}$/.test(item.id)) ? item.id : crypto.randomUUID(),
      q: cleanLangPair(item && item.q, 300),
      a: cleanLangPair(item && item.a, 2000)
    };
  }).filter(function (item) { return item.q.ru || item.q.en || item.a.ru || item.a.en; });
  return out;
}

/* ---------- Хранилище: Supabase Storage или Cloudflare R2 ---------- */
async function sb(method, path, body, type) {
  const headers = { Authorization: 'Bearer ' + SB_KEY, apikey: SB_KEY };
  if (type) { headers['Content-Type'] = type; headers['x-upsert'] = 'true'; }
  return fetch(SB_URL + '/storage/v1/object/' + path, { method: method, headers: headers, body: body });
}

/* Cloudflare R2 через S3 REST API с подписью AWS Signature V4 (без SDK) */
function hmacRaw(key, s) { return crypto.createHmac('sha256', key).update(s, 'utf8').digest(); }
async function r2(method, key, body, type) {
  const host = R2_ACCOUNT_ID + '.r2.cloudflarestorage.com';
  const uri = '/' + R2_BUCKET + '/' + key;
  const amzDate = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const shortDate = amzDate.slice(0, 8);
  const payloadHash = crypto.createHash('sha256').update(body || '').digest('hex');
  const headers = { host: host, 'x-amz-content-sha256': payloadHash, 'x-amz-date': amzDate };
  if (type) headers['content-type'] = type;
  const signedNames = Object.keys(headers).sort();
  const canonical = [method, uri, '', signedNames.map(function (h) { return h + ':' + headers[h]; }).join('\n') + '\n', signedNames.join(';'), payloadHash].join('\n');
  const scope = shortDate + '/auto/s3/aws4_request';
  const toSign = ['AWS4-HMAC-SHA256', amzDate, scope, crypto.createHash('sha256').update(canonical, 'utf8').digest('hex')].join('\n');
  let k = hmacRaw('AWS4' + R2_SECRET_ACCESS_KEY, shortDate);
  k = hmacRaw(k, 'auto'); k = hmacRaw(k, 's3'); k = hmacRaw(k, 'aws4_request');
  const signature = crypto.createHmac('sha256', k).update(toSign, 'utf8').digest('hex');
  const out = {
    Authorization: 'AWS4-HMAC-SHA256 Credential=' + R2_ACCESS_KEY_ID + '/' + scope + ', SignedHeaders=' + signedNames.join(';') + ', Signature=' + signature,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate
  };
  if (type) out['content-type'] = type;
  return fetch('https://' + host + uri, { method: method, headers: out, body: body });
}

/* Единая точка доступа к хранилищу: key вида "cms/имя-файла" */
function localStore(method, key, body) {
  const file = pathLocal.join(LOCAL_DIR, key.replace(/[^a-zA-Z0-9._/-]/g, '_'));
  try {
    if (method === 'GET') {
      if (!fsLocal.existsSync(file)) return { ok: false, status: 404, text: async function () { return ''; }, arrayBuffer: async function () { return Buffer.alloc(0); } };
      const buf = fsLocal.readFileSync(file);
      return { ok: true, status: 200, text: async function () { return buf.toString('utf8'); }, arrayBuffer: async function () { return buf; } };
    }
    if (method === 'PUT' || method === 'POST') {
      fsLocal.mkdirSync(pathLocal.dirname(file), { recursive: true });
      fsLocal.writeFileSync(file, Buffer.isBuffer(body) ? body : Buffer.from(String(body), 'utf8'));
      return { ok: true, status: 200, text: async function () { return ''; }, arrayBuffer: async function () { return Buffer.alloc(0); } };
    }
    if (method === 'DELETE') {
      if (fsLocal.existsSync(file)) fsLocal.unlinkSync(file);
      return { ok: true, status: 200, text: async function () { return ''; }, arrayBuffer: async function () { return Buffer.alloc(0); } };
    }
  } catch (e) {
    return { ok: false, status: 500, text: async function () { return String(e && e.message); }, arrayBuffer: async function () { return Buffer.alloc(0); } };
  }
  return { ok: false, status: 400, text: async function () { return ''; }, arrayBuffer: async function () { return Buffer.alloc(0); } };
}

async function store(method, key, body, type) {
  if (LOCAL_STORE) return localStore(method, key, body);
  if (USE_R2) return r2(method === 'POST' ? 'PUT' : method, key, body, type);
  return sb(method === 'PUT' ? 'POST' : method, BUCKET + '/' + key, body, type);
}
/* список объектов R2 (ListObjectsV2) для подсчёта занятого места */
async function r2List(prefix, token) {
  const host = R2_ACCOUNT_ID + '.r2.cloudflarestorage.com';
  const uri = '/' + R2_BUCKET;
  const parts = ['list-type=2', 'max-keys=1000', 'prefix=' + encodeURIComponent(prefix || '')];
  if (token) parts.push('continuation-token=' + encodeURIComponent(token));
  const qs = parts.sort().join('&');
  const amzDate = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const shortDate = amzDate.slice(0, 8);
  const payloadHash = crypto.createHash('sha256').update('').digest('hex');
  const headers = { host: host, 'x-amz-content-sha256': payloadHash, 'x-amz-date': amzDate };
  const signedNames = Object.keys(headers).sort();
  const canonical = ['GET', uri, qs, signedNames.map(function (x) { return x + ':' + headers[x]; }).join('\n') + '\n', signedNames.join(';'), payloadHash].join('\n');
  const scope = shortDate + '/auto/s3/aws4_request';
  const toSign = ['AWS4-HMAC-SHA256', amzDate, scope, crypto.createHash('sha256').update(canonical, 'utf8').digest('hex')].join('\n');
  let k = hmacRaw('AWS4' + R2_SECRET_ACCESS_KEY, shortDate);
  k = hmacRaw(k, 'auto'); k = hmacRaw(k, 's3'); k = hmacRaw(k, 'aws4_request');
  const signature = crypto.createHmac('sha256', k).update(toSign, 'utf8').digest('hex');
  const res = await fetch('https://' + host + uri + '?' + qs, {
    method: 'GET',
    headers: {
      Authorization: 'AWS4-HMAC-SHA256 Credential=' + R2_ACCESS_KEY_ID + '/' + scope + ', SignedHeaders=' + signedNames.join(';') + ', Signature=' + signature,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate
    }
  });
  if (!res.ok) throw new Error('R2 list ' + res.status);
  return res.text();
}

async function storageUsage() {
  const out = { used: 0, files: 0, source: 'content' };
  if (LOCAL_STORE) {
    const dir = pathLocal.join(LOCAL_DIR, 'cms');
    try {
      const names = fsLocal.existsSync(dir) ? fsLocal.readdirSync(dir) : [];
      names.forEach(function (n) {
        if (n === 'content.json') return;
        const st = fsLocal.statSync(pathLocal.join(dir, n));
        if (st.isFile()) { out.used += st.size; out.files += 1; }
      });
      out.source = 'local';
      return out;
    } catch (e) { console.error('CMS usage local:', e && e.message); }
  } else if (USE_R2) {
    try {
      let token = '';
      let guard = 0;
      do {
        const xml = await r2List('cms/', token);
        const sizes = xml.match(/<Size>(\d+)<\/Size>/g) || [];
        sizes.forEach(function (s) { out.used += Number(s.replace(/[^0-9]/g, '')) || 0; });
        out.files += (xml.match(/<Key>/g) || []).length;
        const more = /<IsTruncated>true<\/IsTruncated>/.test(xml);
        const nt = xml.match(/<NextContinuationToken>([^<]+)<\/NextContinuationToken>/);
        token = more && nt ? nt[1] : '';
      } while (token && ++guard < 30);
      out.source = 'r2';
      return out;
    } catch (e) { console.error('CMS usage r2:', e && e.message); }
  } else if (SB_URL && SB_KEY) {
    try {
      const rr = await fetch(SB_URL + '/storage/v1/object/list/' + BUCKET, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + SB_KEY, apikey: SB_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefix: 'cms/', limit: 1000, offset: 0 })
      });
      if (rr.ok) {
        const arr = await rr.json();
        (Array.isArray(arr) ? arr : []).forEach(function (o) {
          const sz = o && o.metadata && Number(o.metadata.size);
          if (o && o.name === 'content.json') return;
          if (sz) { out.used += sz; out.files += 1; }
        });
        out.source = 'supabase';
        return out;
      }
    } catch (e) { console.error('CMS usage supabase:', e && e.message); }
  }
  /* фолбэк: сумма размеров из content.json */
  try {
    const c = await readContent();
    const seen = {};
    (function walk(node) {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) { node.forEach(walk); return; }
      if (typeof node.url === 'string' && Number(node.size) && !seen[node.url]) {
        seen[node.url] = 1;
        out.used += Number(node.size);
        out.files += 1;
      }
      Object.keys(node).forEach(function (key) { walk(node[key]); });
    })(c);
  } catch (e) { console.error('CMS usage content:', e && e.message); }
  return out;
}

async function readContent() {
  try {
    const r = await store('GET', 'cms/content.json');
    if (r.ok) {
      let raw = await r.text();
      if (USE_R2 && R2_PUBLIC_BASE_URL) raw = raw.split(R2_PUBLIC_BASE_URL + '/cms/').join('/api/img/');
      const c = Object.assign(defaults(), JSON.parse(raw));
      /* миграция: прежние заглушки панели не должны перекрывать родной анимированный текст сайта */
      if (c.admin && c.admin.loader) {
        const lo = c.admin.loader;
        if (lo.title && lo.title.ru === 'Алиса Митерова' && lo.title.en === 'Alisa Miterova') lo.title = { ru: '', en: '' };
        if (lo.subtitle && lo.subtitle.ru === 'Фотограф · Москва' && lo.subtitle.en === 'Photographer · Moscow') lo.subtitle = { ru: '', en: '' };
      }
      return c;
    }
  } catch (e) { console.error('CMS content read:', e && e.message); }
  return defaults();
}
async function writeContentJson(c) {
  const r = await store('PUT', 'cms/content.json', JSON.stringify(c), 'application/json');
  if (!r.ok) throw new Error('storage write ' + r.status);
}

/* ---------- сессии / CSRF (stateless, подпись HMAC) ---------- */
function b64u(v) { return Buffer.from(String(v), 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function unb64u(v) { try { return Buffer.from(String(v).replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'); } catch (e) { return ''; } }
function makeSession(user) { const exp = Date.now() + TTL; const eu = b64u(user || ''); return exp + '.' + eu + '.' + hmac('sess.' + exp + '.' + eu); }
function getSession(req) {
  const m = /(?:^|;\s*)cms_s=([^;]+)/.exec(String(req.headers.cookie || ''));
  if (!m) return null;
  const p = m[1].split('.');
  if (p.length === 3 && /^\d+$/.test(p[0]) && Number(p[0]) >= Date.now() && safeEq(p[2], hmac('sess.' + p[0] + '.' + p[1]))) return { exp: p[0], user: unb64u(p[1]) };
  if (p.length === 2 && /^\d+$/.test(p[0]) && Number(p[0]) >= Date.now() && safeEq(p[1], hmac('sess.' + p[0]))) return { exp: p[0], user: '' };
  return null;
}
function csrfOf(exp) { return hmac('csrf.' + exp).slice(0, 48); }
function verifyPass(p) {
  try {
    const parts = String(PASS_HASH).split('$');
    if (parts.length !== 2) return false;
    const want = Buffer.from(parts[1], 'hex');
    const got = crypto.scryptSync(String(p || ''), parts[0], want.length || 64);
    return want.length === got.length && crypto.timingSafeEqual(want, got);
  } catch (e) { return false; }
}
function verifyHash(p, hash) {
  try {
    const parts = String(hash || '').split('$');
    if (parts.length !== 2) return false;
    const want = Buffer.from(parts[1], 'hex');
    const got = crypto.scryptSync(String(p || ''), parts[0], want.length || 64);
    return want.length === got.length && crypto.timingSafeEqual(want, got);
  } catch (e) { return false; }
}
function hashPass(p) { const salt = crypto.randomBytes(9).toString('hex'); return salt + '$' + crypto.scryptSync(String(p), salt, 64).toString('hex'); }

/* ---------- администраторы: хранятся в cms/admins.json ---------- */
async function readAdmins() {
  try {
    const r = await store('GET', 'cms/admins.json');
    if (r.ok) {
      const j = JSON.parse(await r.text());
      return {
        admins: (Array.isArray(j.admins) ? j.admins : []).filter(function (a) { return a && typeof a.user === 'string' && typeof a.hash === 'string'; }),
        rootHash: typeof j.rootHash === 'string' ? j.rootHash : '',
        rootTag: typeof j.rootTag === 'string' ? j.rootTag : ''
      };
    }
  } catch (e) { console.error('CMS admins read:', e && e.message); }
  return { admins: [], rootHash: '', rootTag: '' };
}
async function writeAdmins(acc) {
  const r = await store('PUT', 'cms/admins.json', JSON.stringify(acc), 'application/json');
  if (!r.ok) throw new Error('storage write ' + r.status);
}

/* ---------- лимит попыток входа (в рамках тёплого инстанса) ---------- */
const ATT = new Map();
function tooMany(ip) {
  const now = Date.now(); const a = ATT.get(ip) || { n: 0, t: now };
  if (now - a.t > 15 * 60 * 1000) { a.n = 0; a.t = now; }
  return a.n >= 8;
}
function fail(ip) {
  const now = Date.now(); const a = ATT.get(ip) || { n: 0, t: now };
  if (now - a.t > 15 * 60 * 1000) { a.n = 0; a.t = now; }
  a.n++; ATT.set(ip, a);
}

/* ---------- ответы ---------- */
function send(res, code, obj) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(obj));
}
function publicContent(c, req, forceMode) {
  const rich = c.admin;
  const texts = [];
  SLOTS.forEach(function (sl) {
    const t = c.texts && c.texts[sl.id];
    if (t && (t.ru || t.en)) texts.push({ sel: sl.sel, ru: t.ru || '', en: t.en || '', rep: sl.rep || 0 });
  });
  (c.custom || []).forEach(function (x) { texts.push({ sel: x.sel, ru: x.ru || '', en: x.en || '', rep: 0 }); });
  const out = { texts: texts };
  if (rich && (rich.loader.subtitle.ru || rich.loader.subtitle.en)) {
    const sub2 = rich.loader.subtitle2 || { ru: '', en: '' };
    out.rsub = {
      ru: [rich.loader.subtitle.ru || '', sub2.ru || ''],
      en: [rich.loader.subtitle.en || '', sub2.en || '']
    };
  } else if (c.rsub) out.rsub = c.rsub;
  if (rich && rich.loader.subtitleM && (rich.loader.subtitleM.ru || rich.loader.subtitleM.en)) {
    out.rsubM = { ru: rich.loader.subtitleM.ru || '', en: rich.loader.subtitleM.en || '' };
  }
  if (c.title) out.title = c.title;
  let richCovers = null;
  if (rich && rich.home) {
    const ua = String(req && req.headers && req.headers['user-agent'] || '');
    const uaMode = /Mobile|Android|iPhone|iPod/i.test(ua) ? 'mobile' : (/iPad|Tablet/i.test(ua) ? 'tablet' : 'desktop');
    const mode = (forceMode === 'mobile' || forceMode === 'tablet' || forceMode === 'desktop') ? forceMode : uaMode;
    const selected = rich.home[mode] || rich.home.desktop || {};
    const fallback = rich.home.desktop || {};
    richCovers = {};
    ['L', 'R'].forEach(function (side) {
      const image = selected[side] || fallback[side];
      const entry = {};
      if (image && image.url) entry.url = image.url;
      const pp = rich.home.pos && rich.home.pos[mode] && rich.home.pos[mode][side];
      if (pp && isFinite(pp.x) && isFinite(pp.y)) entry.pos = Number(pp.x) + '% ' + Number(pp.y) + '%';
      if (entry.url || entry.pos) richCovers[side] = entry;
    });
  }
  if (richCovers && Object.keys(richCovers).length) out.covers = richCovers;
  else if (c.covers && Object.keys(c.covers).length) out.covers = c.covers;
  if (rich && rich.home && rich.home.texts) {
    const homeSel = { tagL: ['#ctL .ctag', '#cfL .ctag'], smallL: ['#ctL .ct1i', '#cfL .ct1i'], subL: ['#ctL .ct2', '#cfL .ct2'], subR: ['#ctR .ct2', '#cfR .ct2'] };
    const brify = function (x) { return String(x || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>'); };
    Object.keys(homeSel).forEach(function (key) {
      const pair = rich.home.texts[key];
      if (!pair || (!pair.ru && !pair.en)) return;
      homeSel[key].forEach(function (sel) {
        texts.push({ sel: sel, ru: brify(pair.ru), en: brify(pair.en), rep: 0 });
      });
    });
  }
  if (rich && rich.portfolio.albums.length) {
    out.secs = Object.assign({}, c.secs || {});
    out.secs.pf = { items: rich.portfolio.albums.map(function (album) { return [album.title.ru, album.title.en]; }) };
  } else if (c.secs) out.secs = c.secs;
  if (rich && rich.work.cards.length) {
    out.secs = Object.assign({}, out.secs || c.secs || {});
    out.secs.wk = {
      items: rich.work.cards.map(function (card) {
        return [card.title.ru, card.title.en, card.price.ru, card.price.en, card.features.ru, card.features.en];
      })
    };
  }
  if (rich && rich.contacts.length) {
    out.contacts = rich.contacts.map(function (contact) {
      return { icon: contact.icon, l: contact.label, s: contact.value || contact.href, h: contact.href };
    });
  } else if (c.contacts && c.contacts.length) out.contacts = c.contacts;
  if (rich && rich.faq && rich.faq.length) {
    const escf = function (x) { return String(x || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>'); };
    out.faq = {
      ru: rich.faq.map(function (item) { return { id: item.id, q: escf(item.q.ru || item.q.en), a: escf(item.a.ru || item.a.en) }; }),
      en: rich.faq.map(function (item) { return { id: item.id, q: escf(item.q.en || item.q.ru), a: escf(item.a.en || item.a.ru) }; })
    };
  }
  if (rich && rich.portfolio.albums.length) {
    out.gallery = [];
    rich.portfolio.albums.forEach(function (album) {
      album.photos.forEach(function (photo) { out.gallery.push({ url: photo.url, pos: '' }); });
    });
  } else if (c.gallery && c.gallery.length) out.gallery = c.gallery.map(function (x) { return { url: x.url, pos: x.pos || '' }; });
  if (rich) {
    out.admin = {
      loader: rich.loader,
      home: rich.home,
      portfolio: rich.portfolio,
      work: rich.work
    };
  }
  return out;
}
async function readBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (Buffer.isBuffer(req.body)) { try { return JSON.parse(req.body.toString('utf8')); } catch (e) { return {}; } }
    if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch (e) { return {}; } }
    if (typeof req.body === 'object') return req.body;
  }
  return new Promise(function (resolve) {
    let buf = '';
    req.on('data', function (d) { buf += d; if (buf.length > 6e6) resolve({}); });
    req.on('end', function () { try { resolve(JSON.parse(buf)); } catch (e) { resolve({}); } });
    req.on('error', function () { resolve({}); });
  });
}
function sniff(buf) {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.length > 7 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'png';
  if (buf.length > 11 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return null;
}

/* ---------- обработчик ---------- */
module.exports = async function handler(req, res) {
  try {
    const url = new URL(req.url || '/', 'http://x');
    const p = String((req.query && req.query.p) || url.searchParams.get('p') || '').replace(/^\/+|\/+$/g, '').toLowerCase();
    const method = String(req.method || 'GET').toUpperCase();
    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';

    if (['GET', 'POST', 'PUT', 'DELETE'].indexOf(method) < 0) return send(res, 404, { error: 'Not found' });

    const r2Vars = [['R2_ACCOUNT_ID', R2_ACCOUNT_ID], ['R2_ACCESS_KEY_ID', R2_ACCESS_KEY_ID], ['R2_SECRET_ACCESS_KEY', R2_SECRET_ACCESS_KEY]];
    const storageVars = (LOCAL_STORE || USE_R2) ? [] : (r2Vars.some(function (x) { return x[1]; }) ? r2Vars : [['SUPABASE_URL', SB_URL], ['SUPABASE_SERVICE_ROLE_KEY', SB_KEY]]);
    const missEnv = storageVars.concat([['SESSION_SECRET', SECRET], ['ADMIN_PASSWORD_HASH', PASS_HASH], ['ADMIN_USER', ADMIN_USER]]).filter(function (x) { return !x[1]; }).map(function (x) { return x[0]; });
    if (missEnv.length) {
      if (p === 'content') return send(res, 200, { texts: [] });
      console.error('CMS missing env: ' + missEnv.join(', '));
      return send(res, 500, { error: 'Не заданы переменные окружения в Vercel: ' + missEnv.join(', ') + '. Добавьте их в Project → Settings → Environment Variables и сделайте Redeploy.' });
    }

    /* публичный контент для сайта */
    if (p.indexOf('img/') === 0 && (method === 'GET' || method === 'HEAD')) {
      const name = p.slice(4);
      if (!/^[a-f0-9-]{36}\.(jpg|png|webp|avif)$/.test(name)) return send(res, 404, { error: 'Not found' });
      const r = await store('GET', 'cms/' + name);
      if (!r || !r.ok) return send(res, 404, { error: 'Not found' });
      const buf = Buffer.from(await r.arrayBuffer());
      res.statusCode = 200;
      res.setHeader('Content-Type', name.slice(-5) === '.avif' ? 'image/avif' : name.slice(-5) === '.webp' ? 'image/webp' : name.slice(-4) === '.png' ? 'image/png' : 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
      res.setHeader('Content-Length', buf.length);
      if (method === 'HEAD') return res.end();
      return res.end(buf);
    }

    if (p === 'content' && method === 'GET') {
      return send(res, 200, publicContent(await readContent(), req));
    }

    /* вход */
    if (p === 'login' && method === 'POST') {
      if (tooMany(ip)) return send(res, 429, { error: 'Слишком много попыток. Подождите 15 минут.' });
      const j = await readBody(req);
      const u = clean(j.u, 80);
      const acc = await readAdmins();
      let uid = '';
      let passOk = false;
      if (safeEq(u, ADMIN_USER)) {
        passOk = acc.rootHash ? verifyHash(j.p, acc.rootHash) : verifyPass(j.p);
      }
      if (!passOk) {
        const found = acc.admins.filter(function (a) { return safeEq(u, a.user); })[0];
        if (found && verifyHash(j.p, found.hash)) { passOk = true; uid = found.user; }
      }
      if (!passOk) {
        fail(ip);
        console.error('CMS login FAIL ip=' + ip);
        await new Promise(function (r) { setTimeout(r, 350); });
        return send(res, 401, { error: 'Неверный логин или пароль' });
      }
      const tok = makeSession(uid);
      res.setHeader('Set-Cookie', 'cms_s=' + tok + '; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=' + Math.floor(TTL / 1000));
      console.error('CMS login OK ip=' + ip);
      return send(res, 200, { ok: true, csrf: csrfOf(tok.split('.')[0]) });
    }

    if (p === 'logout' && method === 'POST') {
      res.setHeader('Set-Cookie', 'cms_s=; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=0');
      return send(res, 200, { ok: true });
    }

    /* вход по magic-ссылке */
    if (p === 'mlogin' && method === 'POST') {
      if (tooMany(ip)) return send(res, 429, { error: 'Слишком много попыток. Подождите 15 минут.' });
      const j = await readBody(req);
      const t = String(j.t || '').split('.');
      const okT = t.length === 2 && /^\d+$/.test(t[0]) && Number(t[0]) > Date.now() && safeEq(t[1], hmac('magic.' + t[0]));
      if (!okT) { fail(ip); console.error('CMS magic FAIL ip=' + ip); return send(res, 401, { error: 'Ссылка недействительна или устарела' }); }
      const tok = makeSession('');
      res.setHeader('Set-Cookie', 'cms_s=' + tok + '; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=' + Math.floor(TTL / 1000));
      console.error('CMS magic login OK ip=' + ip);
      return send(res, 200, { ok: true, csrf: csrfOf(tok.split('.')[0]) });
    }

    /* далее — только с валидной сессией */
    const sess = getSession(req);
    if (!sess) return send(res, 401, { error: 'Не авторизован' });

    if (p === 'state' && method === 'GET') {
      let me = { user: ADMIN_USER || 'admin', name: 'Владелец', root: true };
      if (sess.user) {
        const accS = await readAdmins();
        const meRec = accS.admins.filter(function (a) { return a.user === sess.user; })[0];
        if (!meRec) return send(res, 401, { error: 'Не авторизован' });
        me = { user: meRec.user, name: meRec.name || meRec.user, root: false };
      }
      return send(res, 200, { content: await readContent(), slots: SLOTS, csrf: csrfOf(sess.exp), me: me });
    }

    if (p === 'storage' && method === 'GET') {
      const usage = await storageUsage();
      return send(res, 200, { used: usage.used, files: usage.files, source: usage.source, limit: 10 * 1024 * 1024 * 1024 });
    }

    if (p === 'admins' && method === 'GET') {
      const accL = await readAdmins();
      const list = [{ id: 'root', name: 'Владелец', tag: accL.rootTag || '', user: ADMIN_USER || 'admin', root: true, you: !sess.user }].concat(accL.admins.map(function (a) {
        return { id: a.id, name: a.name || a.user, tag: a.tag || '', user: a.user, root: false, you: sess.user === a.user };
      }));
      return send(res, 200, { admins: list });
    }

    /* изменяющие запросы — проверка CSRF */
    if (!safeEq(String(req.headers['x-csrf'] || ''), csrfOf(sess.exp))) {
      return send(res, 403, { error: 'Сессия устарела, обновите страницу' });
    }

    /* автоперевод RU -> EN */
    if (p === 'translate' && method === 'POST') {
      const jt = await readBody(req);
      const q = clean(jt && jt.q, 3000);
      if (!q) return send(res, 200, { text: '' });
      try {
        const rr = await fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=ru&tl=en&dt=t&q=' + encodeURIComponent(q));
        if (!rr.ok) throw new Error('HTTP ' + rr.status);
        const data = await rr.json();
        let out = '';
        if (Array.isArray(data) && Array.isArray(data[0])) {
          out = data[0].map(function (x) { return (x && x[0]) || ''; }).join('');
        }
        return send(res, 200, { text: out });
      } catch (e) {
        return send(res, 502, { error: 'Автоперевод недоступен: ' + (e && e.message ? e.message : 'error') });
      }
    }

    /* генерация magic-ссылки для входа (действует 15 минут) */
    if (p === 'magic' && method === 'POST') {
      const exp = Date.now() + 15 * 60 * 1000;
      return send(res, 200, { token: exp + '.' + hmac('magic.' + exp), ttlMin: 15 });
    }

    /* администраторы: создание, удаление, смена пароля */
    if (p === 'admin-add' && method === 'POST') {
      const j = await readBody(req);
      const name = clean(j.name, 60);
      const tag = clean(j.tag, 40);
      const user = clean(j.user, 40);
      const pass = String(j.password || '');
      if (!/^[a-zA-Z0-9._@-]{3,40}$/.test(user)) return send(res, 400, { error: 'Логин: 3–40 символов — латиница, цифры, точки, дефисы' });
      if (pass.length < 8) return send(res, 400, { error: 'Пароль должен быть не короче 8 символов' });
      const acc = await readAdmins();
      if (safeEq(user, ADMIN_USER) || acc.admins.some(function (a) { return a.user === user; })) return send(res, 400, { error: 'Такой логин уже занят' });
      if (acc.admins.length >= 20) return send(res, 400, { error: 'Слишком много администраторов (до 20)' });
      acc.admins.push({ id: crypto.randomUUID(), name: name || user, tag: tag, user: user, hash: hashPass(pass), createdAt: Date.now() });
      await writeAdmins(acc);
      return send(res, 200, { ok: true });
    }

    /* редактирование тега (и имени) администратора */
    if (p === 'admin-edit' && method === 'POST') {
      const j = await readBody(req);
      const id = clean(j.id, 60);
      const tag = clean(j.tag, 40);
      const name = j.name === undefined ? null : clean(j.name, 60);
      if (!id) return send(res, 400, { error: 'Администратор не найден' });
      const acc = await readAdmins();
      const isOwner = !sess.user;
      if (id === 'root') {
        if (!isOwner) return send(res, 403, { error: 'Менять запись владельца может только владелец' });
        acc.rootTag = tag;
        await writeAdmins(acc);
        return send(res, 200, { ok: true });
      }
      const rec = acc.admins.filter(function (a) { return a.id === id; })[0];
      if (!rec) return send(res, 404, { error: 'Администратор не найден' });
      if (!isOwner && rec.user !== sess.user) return send(res, 403, { error: 'Менять чужую запись может только владелец' });
      rec.tag = tag;
      if (name) rec.name = name;
      await writeAdmins(acc);
      return send(res, 200, { ok: true });
    }

    if (p === 'admin-del' && method === 'POST') {
      const j = await readBody(req);
      const id = clean(j.id, 60);
      if (!id || id === 'root') return send(res, 400, { error: 'Владельца удалить нельзя' });
      if (sess.user) return send(res, 403, { error: 'Удалять администраторов может только владелец' });
      const acc = await readAdmins();
      const victim = acc.admins.filter(function (a) { return a.id === id; })[0];
      if (victim && sess.user && victim.user === sess.user) return send(res, 403, { error: 'Себя удалить нельзя' });
      const count0 = acc.admins.length;
      acc.admins = acc.admins.filter(function (a) { return a.id !== id; });
      if (acc.admins.length === count0) return send(res, 404, { error: 'Администратор не найден' });
      await writeAdmins(acc);
      return send(res, 200, { ok: true });
    }

    if (p === 'password' && method === 'POST') {
      const j = await readBody(req);
      const pass = String(j.password || '');
      if (pass.length < 8) return send(res, 400, { error: 'Новый пароль должен быть не короче 8 символов' });
      const acc = await readAdmins();
      if (sess.user) {
        const meRec = acc.admins.filter(function (a) { return a.user === sess.user; })[0];
        if (!meRec) return send(res, 404, { error: 'Аккаунт не найден' });
        if (!verifyHash(j.old, meRec.hash)) return send(res, 403, { error: 'Текущий пароль не подходит' });
        meRec.hash = hashPass(pass);
      } else {
        const okOld = acc.rootHash ? verifyHash(j.old, acc.rootHash) : verifyPass(j.old);
        if (!okOld) return send(res, 403, { error: 'Текущий пароль не подходит' });
        acc.rootHash = hashPass(pass);
      }
      await writeAdmins(acc);
      return send(res, 200, { ok: true });
    }

    /* загрузка фото с автоматической lossless-конвертацией в AVIF */
    if (p === 'upload' && method === 'POST') {
      const j = await readBody(req);
      if (typeof j.data !== 'string' || !j.data || j.data.length > 5.7e6) return send(res, 400, { error: 'Файл слишком большой (до 4 МБ)' });
      let buf;
      try { buf = Buffer.from(j.data, 'base64'); } catch (e) { return send(res, 400, { error: 'Повреждённый файл' }); }
      if (!buf || buf.length < 100 || buf.length > 4.1 * 1024 * 1024) return send(res, 400, { error: 'Файл слишком большой (до 4 МБ)' });
      try {
        const LIMIT_BYTES = 10 * 1024 * 1024 * 1024;
        const cur = await readContent();
        let used = 0;
        (function walk(node) {
          if (!node || typeof node !== 'object') return;
          if (Array.isArray(node)) { node.forEach(walk); return; }
          if (typeof node.url === 'string' && typeof node.size === 'number') used += node.size;
          for (const key of Object.keys(node)) walk(node[key]);
        })(cur);
        if (used + buf.length > LIMIT_BYTES) {
          return send(res, 413, { error: 'Достигнут лимит 10 ГБ. Удалите часть фотографий, чтобы загрузить новые.' });
        }
      } catch (e) { console.error('CMS quota check:', e && e.message); }
      let converted;
      if (!sharp) {
        const kind = sniff(buf);
        if (!kind) return send(res, 400, { error: 'Локальный режим без sharp принимает только JPG, PNG или WebP.' });
        const rawName = crypto.randomUUID() + '.' + kind;
        const rawRes = await store('PUT', 'cms/' + rawName, buf, 'image/' + (kind === 'jpg' ? 'jpeg' : kind));
        if (!rawRes.ok) return send(res, 500, { error: 'Ошибка хранилища (' + rawRes.status + ')' });
        return send(res, 200, { url: PUB_BASE + rawName, name: rawName, size: buf.length });
      }
      try {
        converted = await sharp(buf, { animated: false, failOn: 'error', limitInputPixels: 100000000 })
          .rotate()
          .avif({ lossless: true, effort: 5 })
          .toBuffer();
      } catch (e) {
        console.error('CMS image convert:', e && e.message);
        return send(res, 400, { error: 'Этот формат не удалось открыть. Попробуйте JPG, PNG, WebP, TIFF, GIF или AVIF.' });
      }
      const name = crypto.randomUUID() + '.avif';
      const r = await store('PUT', 'cms/' + name, converted, 'image/avif');
      if (!r.ok) { console.error('CMS upload storage ' + r.status); return send(res, 500, { error: USE_R2 ? 'Ошибка хранилища R2 (' + r.status + '). Проверьте R2_* переменные и имя бакета.' : 'Ошибка хранилища Supabase (' + r.status + '). Проверьте SUPABASE_URL, ключ и бакет.' }); }
      console.error('CMS upload ' + name + ' source=' + clean(j.name, 100) + ' ip=' + ip);
      return send(res, 200, { url: PUB_BASE + name, name: name, size: converted.length });
    }

    /* удаление фото */
    if (p === 'upload' && method === 'DELETE') {
      const name = String((req.query && req.query.name) || url.searchParams.get('name') || '');
      if (!/^[a-f0-9-]{36}\.(jpg|png|webp|avif)$/.test(name)) return send(res, 400, { error: 'Плохое имя файла' });
      await store('DELETE', 'cms/' + name).catch(function () {});
      console.error('CMS delete ' + name + ' ip=' + ip);
      return send(res, 200, { ok: true });
    }

    /* предпросмотр: публичный контент с учётом черновика, ничего не сохраняет */
    if (p === 'preview-content' && method === 'POST') {
      const j = await readBody(req);
      const forceMode = j && typeof j.__mode === 'string' ? j.__mode : '';
      const c = await readContent();
      c.admin = sanitizeAdmin(j);
      return send(res, 200, { ok: true, content: publicContent(c, req, forceMode) });
    }

    /* новая панель: единая атомарная публикация черновика */
    if (p === 'admin-content' && method === 'PUT') {
      const j = await readBody(req);
      const c = await readContent();
      const oldNames = fileNames(c);
      c.admin = sanitizeAdmin(j);
      await writeContentJson(c);
      const newNames = fileNames(c);
      const unused = Array.from(oldNames).filter(function (n) { return !newNames.has(n); });
      if (unused.length) { await Promise.all(unused.map(function (n) { return store('DELETE', 'cms/' + n).catch(function () {}); })); console.error('CMS gc removed ' + unused.join(',')); }
      console.error('CMS publish admin-content ip=' + ip);
      return send(res, 200, { ok: true, content: c.admin });
    }

    /* сохранение разделов */
    if (method === 'PUT') {
      const j = await readBody(req);
      const c = await readContent();
      if (p === 'texts') {
        const t = {};
        SLOTS.forEach(function (sl) {
          const v = j.texts && j.texts[sl.id];
          if (v && (v.ru || v.en)) t[sl.id] = { ru: clean(v.ru, 4000), en: clean(v.en, 4000) };
        });
        c.texts = t;
        c.custom = [];
        (Array.isArray(j.custom) ? j.custom.slice(0, 40) : []).forEach(function (x) {
          const sel = cleanSel(x && x.sel);
          if (sel && ((x.ru && x.ru.trim()) || (x.en && x.en.trim()))) c.custom.push({ sel: sel, ru: clean(x.ru, 4000), en: clean(x.en, 4000) });
        });
      } else if (p === 'rsub') {
        const ok = function (a) { return Array.isArray(a) && a.length === 2 && a.every(function (x) { return typeof x === 'string'; }); };
        const r = { ru: ok(j.ru) ? j.ru.map(function (x) { return clean(x, 600); }) : ['', ''], en: ok(j.en) ? j.en.map(function (x) { return clean(x, 600); }) : ['', ''] };
        c.rsub = (r.ru[0] || r.en[0]) ? r : null;
      } else if (p === 'title') {
        const t = { ru: clean(j.ru, 150), en: clean(j.en, 150) };
        c.title = (t.ru || t.en) ? t : null;
      } else if (p === 'covers') {
        const cv = {};
        ['L', 'R'].forEach(function (k) {
          const v = j[k];
          if (!v) return;
          const o = {};
          const nu = normUploadUrl(v.url);
          if (validUploadUrl(nu)) o.url = nu;
          if (validPos(v.pos)) o.pos = v.pos;
          if (Object.keys(o).length) cv[k] = o;
        });
        c.covers = cv;
      } else if (p === 'secs') {
        const out = {};
        ['pf', 'wk'].forEach(function (k) {
          const v = j[k];
          if (v && Array.isArray(v.items)) {
            const items = v.items.slice(0, 8).map(function (it) {
              return [clean(String((it && it[0]) || ''), 120), clean(String((it && it[1]) || ''), 120)];
            }).filter(function (it) { return it[0] || it[1]; });
            if (items.length) out[k] = { items: items };
          }
        });
        c.secs = Object.keys(out).length ? out : null;
      } else if (p === 'contacts') {
        c.contacts = (Array.isArray(j) ? j.slice(0, 8) : []).map(function (x) {
          return {
            icon: ['tg', 'ig', 'mx', 'ph'].indexOf(x && x.icon) >= 0 ? x.icon : 'tg',
            l: clean(x && x.l, 60),
            s: clean(x && x.s, 120),
            h: validHref(x && x.h) ? x.h : ''
          };
        }).filter(function (x) { return x.l && x.h; });
      } else if (p === 'gallery') {
        c.gallery = (Array.isArray(j) ? j.slice(0, 60) : []).map(function (x) {
          return {
            id: (x && typeof x.id === 'string' && /^[a-f0-9-]{36}$/.test(x.id)) ? x.id : crypto.randomUUID(),
            url: validUploadUrl(normUploadUrl(x && x.url)) ? normUploadUrl(x && x.url) : '',
            pos: validPos(x && x.pos) ? x.pos : ''
          };
        }).filter(function (x) { return x.url; });
      } else {
        return send(res, 404, { error: 'Not found' });
      }
      await writeContentJson(c);
      console.error('CMS save ' + p + ' ip=' + ip);
      return send(res, 200, { ok: true });
    }

    return send(res, 404, { error: 'Not found' });
  } catch (e) {
    console.error('CMS error:', (e && e.stack) || e);
    return send(res, 500, { error: 'Ошибка сервера: ' + ((e && e.message) || 'unknown') });
  }
};

/* ---------- CLI: генерация секретов ---------- */
if (require.main === module) {
  const cmd = process.argv[2];
  if (cmd === 'hash') {
    const pw = process.argv[3];
    if (!pw) { console.log('Использование: node api/router.js hash "пароль"'); process.exit(1); }
    const salt = crypto.randomBytes(16).toString('hex');
    console.log('ADMIN_PASSWORD_HASH=' + salt + '$' + crypto.scryptSync(pw, salt, 64).toString('hex'));
  } else if (cmd === 'secret') {
    console.log('SESSION_SECRET=' + crypto.randomBytes(32).toString('hex'));
  } else {
    console.log('Команды: node api/router.js hash "пароль" | node api/router.js secret');
  }
}

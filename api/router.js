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

const SB_URL = String(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '');
const SB_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const BUCKET = process.env.PHOTOS_BUCKET || process.env.NEXT_PUBLIC_PHOTOS_BUCKET || 'photos';
const ADMIN_USER = String(process.env.ADMIN_USER || '').trim();
const PASS_HASH = String(process.env.ADMIN_PASSWORD_HASH || '').trim();
/* SESSION_SECRET необязателен: если не задан, секрет выводится из ADMIN_PASSWORD_HASH + ключа Supabase */
const SECRET = String(process.env.SESSION_SECRET || '').trim() || (PASS_HASH ? crypto.createHash('sha256').update('cms.secret.v1.' + PASS_HASH + '.' + SB_KEY).digest('hex') : '');
const TTL = 12 * 60 * 60 * 1000;
const PUB_BASE = SB_URL + '/storage/v1/object/public/' + BUCKET + '/cms/';

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
function validUploadUrl(u) { return typeof u === 'string' && u.indexOf(PUB_BASE) === 0 && /^[a-f0-9-]{36}\.(jpg|png|webp)$/.test(u.slice(PUB_BASE.length)); }
function validHref(h) { return typeof h === 'string' && h.length <= 300 && /^(https?:\/\/|tel:|mailto:)[^\s"'<>]+$/i.test(h); }
function defaults() { return { texts: {}, custom: [], rsub: null, title: null, covers: {}, gallery: [], secs: null, contacts: [] }; }

/* ---------- Supabase Storage ---------- */
async function sb(method, path, body, type) {
  const headers = { Authorization: 'Bearer ' + SB_KEY, apikey: SB_KEY };
  if (type) { headers['Content-Type'] = type; headers['x-upsert'] = 'true'; }
  return fetch(SB_URL + '/storage/v1/object/' + path, { method: method, headers: headers, body: body });
}
async function readContent() {
  try {
    const r = await sb('GET', BUCKET + '/cms/content.json');
    if (r.ok) return Object.assign(defaults(), JSON.parse(await r.text()));
  } catch (e) { console.error('CMS content read:', e && e.message); }
  return defaults();
}
async function writeContentJson(c) {
  const r = await sb('POST', BUCKET + '/cms/content.json', JSON.stringify(c), 'application/json');
  if (!r.ok) throw new Error('storage write ' + r.status);
}

/* ---------- сессии / CSRF (stateless, подпись HMAC) ---------- */
function makeSession() { const exp = Date.now() + TTL; return exp + '.' + hmac('sess.' + exp); }
function getSession(req) {
  const m = /(?:^|;\s*)cms_s=([^;]+)/.exec(String(req.headers.cookie || ''));
  if (!m) return null;
  const p = m[1].split('.');
  if (p.length !== 2 || !/^\d+$/.test(p[0])) return null;
  if (Number(p[0]) < Date.now()) return null;
  if (!safeEq(p[1], hmac('sess.' + p[0]))) return null;
  return { exp: p[0] };
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
function publicContent(c) {
  const texts = [];
  SLOTS.forEach(function (sl) {
    const t = c.texts && c.texts[sl.id];
    if (t && (t.ru || t.en)) texts.push({ sel: sl.sel, ru: t.ru || '', en: t.en || '', rep: sl.rep || 0 });
  });
  (c.custom || []).forEach(function (x) { texts.push({ sel: x.sel, ru: x.ru || '', en: x.en || '', rep: 0 }); });
  const out = { texts: texts };
  if (c.rsub) out.rsub = c.rsub;
  if (c.title) out.title = c.title;
  if (c.covers && Object.keys(c.covers).length) out.covers = c.covers;
  if (c.secs) out.secs = c.secs;
  if (c.contacts && c.contacts.length) out.contacts = c.contacts;
  if (c.gallery && c.gallery.length) out.gallery = c.gallery.map(function (x) { return { url: x.url, pos: x.pos || '' }; });
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

    if (!SB_URL || !SB_KEY || !SECRET || !PASS_HASH || !ADMIN_USER) {
      if (p === 'content') return send(res, 200, { texts: [] });
      console.error('CMS: не заданы переменные окружения (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_USER, ADMIN_PASSWORD_HASH, SESSION_SECRET)');
      return send(res, 500, { error: 'Server error' });
    }

    /* публичный контент для сайта */
    if (p === 'content' && method === 'GET') {
      return send(res, 200, publicContent(await readContent()));
    }

    /* вход */
    if (p === 'login' && method === 'POST') {
      if (tooMany(ip)) return send(res, 429, { error: 'Слишком много попыток. Подождите 15 минут.' });
      const j = await readBody(req);
      const okU = safeEq(clean(j.u, 80), ADMIN_USER);
      const okP = verifyPass(j.p);
      if (!okU || !okP) {
        fail(ip);
        console.error('CMS login FAIL ip=' + ip);
        await new Promise(function (r) { setTimeout(r, 350); });
        return send(res, 401, { error: 'Неверный логин или пароль' });
      }
      const tok = makeSession();
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
      const tok = makeSession();
      res.setHeader('Set-Cookie', 'cms_s=' + tok + '; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=' + Math.floor(TTL / 1000));
      console.error('CMS magic login OK ip=' + ip);
      return send(res, 200, { ok: true, csrf: csrfOf(tok.split('.')[0]) });
    }

    /* далее — только с валидной сессией */
    const sess = getSession(req);
    if (!sess) return send(res, 401, { error: 'Не авторизован' });

    if (p === 'state' && method === 'GET') {
      return send(res, 200, { content: await readContent(), slots: SLOTS, csrf: csrfOf(sess.exp) });
    }

    /* изменяющие запросы — проверка CSRF */
    if (!safeEq(String(req.headers['x-csrf'] || ''), csrfOf(sess.exp))) {
      return send(res, 403, { error: 'Сессия устарела, обновите страницу' });
    }

    /* генерация magic-ссылки для входа (действует 15 минут) */
    if (p === 'magic' && method === 'POST') {
      const exp = Date.now() + 15 * 60 * 1000;
      return send(res, 200, { token: exp + '.' + hmac('magic.' + exp), ttlMin: 15 });
    }

    /* загрузка фото (JSON: { type, data: base64 }) */
    if (p === 'upload' && method === 'POST') {
      const j = await readBody(req);
      if (typeof j.data !== 'string' || !j.data || j.data.length > 5e6) return send(res, 400, { error: 'Файл слишком большой (до 3 МБ)' });
      let buf;
      try { buf = Buffer.from(j.data, 'base64'); } catch (e) { return send(res, 400, { error: 'Повреждённый файл' }); }
      if (!buf || buf.length < 100 || buf.length > 3.5 * 1024 * 1024) return send(res, 400, { error: 'Файл слишком большой (до 3 МБ)' });
      const ext = sniff(buf);
      if (!ext) return send(res, 400, { error: 'Только JPG, PNG или WebP' });
      const name = crypto.randomUUID() + '.' + ext;
      const r = await sb('POST', BUCKET + '/cms/' + name, buf, ext === 'jpg' ? 'image/jpeg' : 'image/' + ext);
      if (!r.ok) { console.error('CMS upload storage ' + r.status); return send(res, 500, { error: 'Server error' }); }
      console.error('CMS upload ' + name + ' ip=' + ip);
      return send(res, 200, { url: PUB_BASE + name, name: name });
    }

    /* удаление фото */
    if (p === 'upload' && method === 'DELETE') {
      const name = String((req.query && req.query.name) || url.searchParams.get('name') || '');
      if (!/^[a-f0-9-]{36}\.(jpg|png|webp)$/.test(name)) return send(res, 400, { error: 'Плохое имя файла' });
      await sb('DELETE', BUCKET + '/cms/' + name).catch(function () {});
      console.error('CMS delete ' + name + ' ip=' + ip);
      return send(res, 200, { ok: true });
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
          if (validUploadUrl(v.url)) o.url = v.url;
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
            url: validUploadUrl(x && x.url) ? x.url : '',
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
    return send(res, 500, { error: 'Server error' });
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

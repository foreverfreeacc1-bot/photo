/* ============================================================
   Локальный сервер для разработки (без Vercel).
   Запуск:  node dev-server.js
   Затем:   http://localhost:3000        — сайт
            http://localhost:3000/admin  — админ-панель
   Логин по умолчанию: admin / admin (можно поменять переменными
   окружения ADMIN_USER и ADMIN_PASS).
   Контент и загруженные фото пишутся в папку .local-cms/
   ============================================================ */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3000);
const USER = process.env.ADMIN_USER || 'admin';
const PASS = process.env.ADMIN_PASS || 'admin';

const salt = crypto.randomBytes(16).toString('hex');
process.env.CMS_LOCAL = '1';
process.env.CMS_LOCAL_DIR = path.join(ROOT, '.local-cms');
process.env.ADMIN_USER = USER;
process.env.ADMIN_PASSWORD_HASH = salt + '$' + crypto.scryptSync(PASS, salt, 64).toString('hex');
process.env.SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

const router = require('./api/router.js');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4'
};

function safeJoin(rel) {
  const full = path.normalize(path.join(ROOT, rel));
  return full.indexOf(ROOT) === 0 ? full : null;
}

function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === '/' || rel === '') rel = '/index.html';
  let file = safeJoin(rel);
  if (!file) { res.statusCode = 403; return res.end('Forbidden'); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file) && fs.existsSync(file + '.html')) file = file + '.html'; /* cleanUrls: /admin → admin.html */
  if (!fs.existsSync(file)) { res.statusCode = 404; return res.end('Not found'); }
  const buf = fs.readFileSync(file);
  res.statusCode = 200;
  res.setHeader('Content-Type', MIME[path.extname(file).toLowerCase()] || 'application/octet-stream');
  res.setHeader('Cache-Control', 'no-store');
  res.end(buf);
}

http.createServer(function (req, res) {
  const url = new URL(req.url || '/', 'http://localhost');
  if (url.pathname.indexOf('/api/') === 0) {
    /* локально куки должны работать по http — снимаем флаг Secure */
    const origSetHeader = res.setHeader.bind(res);
    res.setHeader = function (name, value) {
      if (String(name).toLowerCase() === 'set-cookie') {
        value = Array.isArray(value)
          ? value.map(function (v) { return String(v).replace(/;\s*Secure/gi, ''); })
          : String(value).replace(/;\s*Secure/gi, '');
      }
      return origSetHeader(name, value);
    };
    req.query = { p: url.pathname.slice(5) };
    Promise.resolve(router(req, res)).catch(function (e) {
      console.error(e);
      if (!res.headersSent) { res.statusCode = 500; res.end('{"error":"dev server error"}'); }
    });
    return;
  }
  serveStatic(req, res, url.pathname);
}).listen(PORT, function () {
  console.log('');
  console.log('  Сайт:    http://localhost:' + PORT);
  console.log('  Админка: http://localhost:' + PORT + '/admin');
  console.log('  Логин:   ' + USER + ' / ' + PASS);
  console.log('  Данные:  ' + process.env.CMS_LOCAL_DIR);
  console.log('');
});


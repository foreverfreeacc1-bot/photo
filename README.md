# Alisa Miterova — сайт + CMS (для Vercel)

Структура:

- `index.html` — сайт (актуальная версия, один файл)
- `admin.html` — CMS-панель, открывается по адресу **`/admin`**
- `api/router.js` — серверная часть CMS (Vercel Serverless Function)
- `vercel.json` — маршруты API и заголовки безопасности

Хранение данных: **Supabase Storage** (у Vercel нет постоянного диска). Контент лежит в бакете как `cms/content.json`, фото — `cms/<uuid>.jpg|png|webp`.

---

## Установка (один раз)

### 1. Supabase

1. ⚠️ **Сначала ротируйте service_role ключ** — старый скомпрометирован: Supabase → Project Settings → API → **Reset** у `service_role`.
2. Storage → создайте бакет `photos` (если нет) и сделайте его **Public**.

### 2. Секреты (локально, нужен Node 18+)

```
node api/router.js hash "ВашНадёжныйПароль"   → ADMIN_PASSWORD_HASH=...
node api/router.js secret                      → SESSION_SECRET=...
```

### 3. Переменные окружения в Vercel

Project → Settings → Environment Variables (Production):

| Переменная | Значение |
|---|---|
| `SUPABASE_URL` | `https://ваш-проект.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | НОВЫЙ ключ после ротации |
| `PHOTOS_BUCKET` | `photos` |
| `ADMIN_USER` | ваш логин |
| `ADMIN_PASSWORD_HASH` | из шага 2 |
| `SESSION_SECRET` | из шага 2 |

Старые `NEXT_PUBLIC_*` переменные можно удалить — в браузер ничего не попадает.

### 4. Деплой

Замените содержимое репозитория файлами из архива, затем:

```
git add -A
git commit -m "Site + CMS"
git push origin main
```

Настройки проекта Vercel: Framework Preset **Other**, Build/Install/Output — пусто.

После деплоя: сайт — `https://домен/`, админка — `https://домен/admin`.

---

## Что редактируется в админке

- **Тексты** — все надписи сайта RU/EN по готовому списку + любой элемент по CSS-селектору
- **Титульный экран** — заголовок вкладки браузера, два абзаца под именем
- **Обложки** — фото PORTFOLIO/WORK на главной + положение кадра
- **Галерея** — фото-миниатюры разделов: загрузка, удаление, кадрирование миниатюр
- **Разделы** — названия карточек в PORTFOLIO и WORK
- **Контакты** — ссылки, подписи, иконки (Telegram/Instagram/MAX/телефон)

Фото до **3 МБ** (лимит запроса Vercel) — большие сожмите перед загрузкой.

---

## Безопасность

| Боль | Как закрыто |
|---|---|
| Открытая админка | Вход по логину/паролю; пароль хранится только как scrypt-хэш; сравнение timing-safe; лимит 8 попыток / 15 мин + задержка при ошибке. По вашему решению `/admin` без проверки IP; при желании её можно добавить правилом в Vercel → Firewall |
| Заголовки | CSP, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, HSTS, COOP — на всех ответах (vercel.json). `/admin` закрыт от индексации (X-Robots-Tag: noindex) |
| IDOR / открытое API | Всё API кроме `GET /api/content` — только с подписанной сессией (HttpOnly, SameSite=Strict, Secure, 12 ч) + CSRF-токен на каждое изменение. Тексты — по белому списку слотов, файлы — только UUID-имена по маске, произвольные пути невозможны. service_role ключ живёт только на сервере |
| FPD / дев-режим | Наружу только `Not found` / `Server error`; детали ошибок — только в логи Vercel (Runtime Logs). Отладочных роутов нет |
| WAF | Валидация всех входных данных (тип/размер/маска, magic bytes у фото). Рекомендуется включить Vercel → Firewall → **Attack Challenge Mode** и Bot Protection — это полноценный WAF на уровне платформы |

Дополнительно: перебор пароля осложнён scrypt (дорогой для атакующего), сессии stateless-подписанные — украсть «базу сессий» невозможно.

---

## Как это работает

- Сайт при загрузке берёт `GET /api/content` (публичный, только чтение) и применяет правки поверх стандартного контента. Если API недоступно — сайт просто работает со стандартным контентом.
- Все `/api/*` запросы через rewrite попадают в одну функцию `api/router.js`.
- Панель `/admin` общается с API: `login`, `state`, `upload`, `PUT texts|rsub|title|covers|secs|contacts|gallery`.

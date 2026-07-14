# Сайт фотографа + CMS (Next.js 14 · Supabase · Vercel)

Публичный сайт-портфолио фотографа + рукописная админ-панель (`/admin`) для
редактирования всех текстовых блоков и фотографий, с RBAC (роли и доступы
к разделам для нескольких администраторов).

## Стек

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** — дизайн-токены (`oklch`) из исходного скетча, шрифты Inter + Instrument Serif
- **Supabase** — Postgres (тексты + метаданные фото), Storage (файлы), Auth (вход)
- **Vercel** — хостинг
- i18n RU/EN на публичном сайте (переключатель в шапке)

## Структура

```
src/
  app/
    page.tsx              # публичный лендинг (читает данные из Supabase)
    layout.tsx            # шрифты + мета
    globals.css           # дизайн-токены и анимации
    admin/                # CMS-панель
      login/              # вход
      content/            # редактор всех текстов (RU/EN)
      photos/             # загрузка/управление фото
      users/              # приглашение админов
      roles/              # роли и доступы (RBAC)
      actions.ts          # server actions (все записи с проверкой прав)
  components/site/        # секции публичного сайта
  components/admin/       # сайдбар панели
  lib/                    # supabase-клиенты, auth/RBAC, данные, i18n
supabase/
  schema.sql              # таблицы, RLS, RBAC, Storage-bucket
  seed.sql                # базовые роли
middleware.ts             # защита /admin + обновление сессии
```

---

## Шаг 1. Supabase

1. Создайте проект на [supabase.com](https://supabase.com) (бесплатный тариф).
2. **SQL Editor** → вставьте и выполните содержимое `supabase/schema.sql`, затем `supabase/seed.sql`.
3. **Project Settings → API** — скопируйте `Project URL`, `anon key` и `service_role key`.
4. Бакет `photos` создаётся автоматически скриптом (публичный на чтение).

### Первый админ (владелец)

**Authentication → Users → Add user** — создайте себя (email + пароль).
Первый созданный пользователь автоматически становится **Владельцем** с полным
доступом. Остальных админов приглашайте через `/admin/users`.

> Для приглашений по email включите отправку писем (Authentication → Email) или
> настройте SMTP. Без SMTP Supabase всё равно создаёт пользователя, но
> ссылку-приглашение придётся выдать вручную из панели Supabase.

## Шаг 2. Локальный запуск

```bash
npm install
cp .env.example .env.local   # заполните ключами Supabase
npm run dev
```

Сайт: http://localhost:3000 · панель: http://localhost:3000/admin

## Шаг 3. Пуш в GitHub

```bash
git init
git add .
git commit -m "Photographer site + CMS"
git branch -M main
git remote add origin https://github.com/n48459107-maker/photo.git
git push -u origin main
```

## Шаг 4. Деплой на Vercel

1. [vercel.com/new](https://vercel.com/new) → Import репозитория `n48459107-maker/photo`.
2. Framework определится как **Next.js** автоматически.
3. Добавьте Environment Variables (из `.env.example`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` — адрес продакшена (напр. `https://photo.vercel.app`)
   - `NEXT_PUBLIC_PHOTOS_BUCKET=photos`
4. **Deploy**. После деплоя в Supabase → Authentication → URL Configuration добавьте
   адрес Vercel в **Redirect URLs** (для приглашений).

## Безопасность

- Весь доступ к `/admin` закрыт middleware + проверкой сессии на сервере.
- Все записи идут через Server Actions, которые проверяют права на раздел.
- На уровне БД включён **RLS**: даже с утекшим anon-ключом нельзя изменить
  данные без прав (политики `can_edit(section)`).
- `service_role key` используется только на сервере (приглашение админов).

## RBAC

Разделы: `content`, `photos`, `users`, `roles`, `settings`. Для каждой роли
настраивается «Просмотр» / «Редактирование». Базовые роли: Владелец (всё),
Редактор (тексты + фото), Редактор фото (только фото). Создавайте свои
роли в `/admin/roles`.

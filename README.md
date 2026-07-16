# Alisa Miterova — Portfolio

Статический сайт-портфолио (один файл `index.html`, всё встроено: стили, скрипты, изображения).

## Деплой на Vercel

### Вариант 1 — через GitHub (рекомендуется)
1. Замените содержимое вашего репозитория файлами из этой папки (`index.html`, `vercel.json`, `.gitignore`, `README.md`). Старые файлы Next.js-проекта (package.json, app/, supabase/ и т.д.) удалите.
2. Закоммитьте и запушьте:
   ```
   git add -A
   git commit -m "Static portfolio site"
   git push origin main
   ```
3. На vercel.com: Add New → Project → выберите репозиторий.
4. Настройки проекта:
   - Framework Preset: **Other**
   - Build Command: — (пусто)
   - Output Directory: — (пусто, по умолчанию корень)
   - Install Command: — (пусто)
5. Deploy.

### Вариант 2 — без GitHub
```
npm i -g vercel
vercel --prod
```

## Переменные окружения (env)
**Не нужны.** Сайт полностью статический: нет бэкенда, базы данных и API-ключей.
Переменные из старого проекта (NEXT_PUBLIC_SUPABASE_URL и т.д.) относились к Next.js + Supabase и для этого сайта не требуются — в Vercel их можно не добавлять (или удалить).

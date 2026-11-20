# DBJU — Don't Buy, Just Use

Маркетплейс оренди речей між людьми: каталог, бронювання, оплата з заставою, чат сторін, фото стану речі,
суперечки, відгуки, реферальна програма, ШІ-помічник і адмін-панель.

**Технології:** Next.js 16 (App Router) · Prisma 5 · MySQL / MariaDB · Cloudflare R2 (фото) · Gemini / Claude (помічник).

## Локальний запуск

Потрібні Node.js 22.12+ і Docker.

```bash
docker compose up -d          # MariaDB (порт 3306) + phpMyAdmin (http://localhost:8081)
cp .env.example .env          # і заповнити значення
npm install
npm run db:deploy             # застосувати міграції
npm run db:seed               # адмін admin@dbju.ua / admin123 (лише локально)
npm run dev                   # http://localhost:3000
```

## Розгортання на сервері

Сайт — звичайний Node.js-застосунок. Хостинг має вміти: Node.js 22.12+, база MySQL 8 / MariaDB 10.6+, HTTPS.

1. **Змінні оточення** — усі описані в [.env.example](.env.example). Обов'язково:
   `DATABASE_URL`, `STORAGE_DRIVER=s3` + ключі `S3_*` (диск сервера тимчасовий — фото мають бути в R2),
   `ADMIN_PASSWORD` (щонайменше 12 символів), ключ ШІ (`GEMINI_API_KEY` або `ANTHROPIC_API_KEY`).
2. **Збірка:** `npm install && npm run build`
3. **Перед кожним запуском нової версії:** `npm run db:deploy` (застосовує нові міграції бази)
4. **Запуск:** `npm start` (порт береться зі змінної `PORT`)
5. **Адміністратор:** один раз `npm run db:seed` — створює адміна з `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
6. **Перевірка:** `GET /api/health` → `{"ok":true}`, якщо сайт і база працюють.

### Перенесення локальних даних

```bash
npm run db:export             # → backups/dbju-<дата>.sql (Docker має бути запущений)
mysql -h HOST -P PORT -u USER -p DBNAME < backups/dbju-<дата>.sql
ADMIN_PASSWORD=... npm run db:seed   # новий пароль адміна; тестовий admin123 на сервері не діє
```

Фото, що лежать лише в локальній папці `uploads/`, переносяться в R2 командою `npm run storage:migrate`.

### Нагадування

Нагадування (повернення завтра, прострочення) сайт запускає сам, коли користувачі заходять.
Для точності можна додати на сервері cron кожні 15 хвилин: `npm run cron`.

### Обмеження поточної версії

- Розмови з ШІ-помічником зберігаються в пам'яті процесу — розраховано на один екземпляр сервера.

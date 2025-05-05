
# Mobile Quiz App

React‑приложение для мобильного прохождения тестов с Google Sheets.

## Настройка

1. В Google Sheets создайте таблицу:
   * A — № вопроса
   * B — текст вопроса
   * C — правильный ответ
   * D..Z — другие варианты
2. Опубликуйте таблицу «для всех в Интернете».
3. Скопируйте её ID и вставьте вместо `YOUR_SHEET_ID` в `src/MobileQuizApp.jsx`.

## Запуск локально

```bash
npm install
npm run dev
```

Откройте `http://localhost:5173`.

## Деплой онлайн

### Vercel

1. Загрузите проект на GitHub.
2. На vercel.com → **New Project** → выберите репозиторий.
3. Build Command: `npm run build`, Output Directory: `dist`.
4. Нажмите **Deploy** – получите публичный URL.

### Netlify

```text
Site settings:
  Build command: npm run build
  Publish directory: dist
```

### GitHub Pages

```bash
npm run build
npx gh-pages -d dist
```

Ссылка вида `https://username.github.io/mobile-quiz-app/`.


# Մեմորիալ · Միքայել Ծատրյան (1958–2025)

Մեմորիալ կայքը հայրիկի համար։ Static landing page on Vite + vanilla JS.

## Արագ սկիզբ / Quick start

```bash
npm install      # install vite once
npm run dev      # dev server at http://localhost:5173
npm run build    # production bundle in dist/
npm run preview  # serve dist/ locally
```

## Ֆայլերի կառուցվածք / Structure

```
index.html        — Главная (interactive scroll story)
biography.html    — Полная биография
photos.html       — Галерея фотографий

css/              — стили (base + per-page)
js/               — ES-модули (app.js + по странице)
public/
  texts/
    sections.json   — 16 секций для главной (am + ru)
    biography.json  — полный текст для bio (am + ru)
    photos.json     — авто-сгенерирован из public/photos/
  photos/         — фото (forMainPage/, studentYears/, …)
  music.mp3       — фоновая музыка (по умолчанию выключена)
  favicon.svg

scripts/
  build-photos-json.mjs  — переcканирует public/photos/ → photos.json
```

## Когда добавляешь/убираешь фото

```bash
npm run scan-photos      # обновит public/texts/photos.json
```

## Деплой

`npm run build` → загрузить содержимое `dist/` на любой статический хост
(Netlify, Vercel, GitHub Pages, простой nginx и т.д.).

## Языки

- Основной — армянский (`am`)
- Переключатель `am ↔ ru` в шапке, состояние в `localStorage`
- Тексты в JSON под ключами `am`, `ru`

## Музыка

`public/music.mp3` — играет только после клика по иконке ноты в шапке.
Состояние сохраняется в `localStorage`.

## Дизайн

- Палитра: тёплый кремовый (`#f4efe5`) + чёрнильный текст + sage green акцент (`#5b7a4a`)
- Типографика: `Noto Serif Armenian` + `Cormorant Garamond`
- Mobile first — каждая секция = один экран телефона со snap-скроллом
# mikaelTsatryan

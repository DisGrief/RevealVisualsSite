# Reveal Visuals

Бесплатная страница лаунчера для Minecraft: кастомное небо, мягкий свет, вода, туман, частицы и снег. Без оплаты, ключей и аккаунта.

## Что внутри

- `index.html` — вся страница: hero, возможности, сравнение до/после, конфиги, установка лаунчера, блок «бесплатно», FAQ, футер.
- `assets/img/before.jpg`, `assets/img/after.jpg` — кадры для ползунка сравнения.
- `assets/img/logo.png` — логотип (белая буква R, прозрачный фон), используется как маска в шапке и подвале.
- `assets/img/favicon.svg` — фавикон: тот же логотип на тёмном скруглённом квадрате.
- `assets/configs/test.json` — тестовый конфиг визуала для секции «Конфиги».
- `assets/configs/zombi.json` — конфиг «КФГ by Zombi».
- `assets/img/configs/zombi-bg.png`, `zombi-sky.jpg`, `zombi-fps.png` — скрины карточки Zombi (фон, небо, FPS).
- `assets/css/styles.css` — дизайн-система, тёмная и светлая темы, компонент сравнения, новогодние акценты.
- `assets/js/app.js` — тема, мобильное меню, ползунок до/после, синхронизация версии с GitHub, прогресс «скачивания», снег на canvas, тосты.
- `assets/js/config.js` — один файл для настройки: владелец и имя репозитория с релизами.
- `server.mjs` — необязательный локальный статический сервер без зависимостей.

## Запуск

```bash
node server.mjs
# http://localhost:4173
```

Можно и просто открыть `index.html` в браузере — сборка не нужна.

## Настройка

- Палитра и радиусы — CSS-переменные в `:root` и `html[data-theme="light"]` в `assets/css/styles.css`.
- Кадры сравнения — замените `assets/img/before.jpg` и `assets/img/after.jpg` (16:9), разметка секции `#compare` в `index.html`.
- Стартовое положение ползунка — `--pos` на `#compareFrame` и `comparePos` в `assets/js/app.js`.
- Выбранная тема хранится в `localStorage` (`reveal_theme`).

## Новогодняя тема

- Палитра праздника — переменные `--ny-ice`, `--ny-gold`, `--ny-red`, `--ny-green` в `:root` и `html[data-theme="light"]`.
- Гирлянда в hero — разметка `.garland` в `index.html`, свечения и позиции лампочек в блоке «New Year theme» в `styles.css`.
- Снег — `<canvas id="snow">` и модуль «new year snowfall» в `app.js`. Плотность зависит от площади экрана, при `prefers-reduced-motion` снег отключается.
- Сезонный текст — hero-лид, бейдж «С Новым годом», подпись в CTA и приветствие в футере.

## Версия с GitHub Releases

Сайт сам подтягивает последний релиз — версия, размер и ссылка на установщик меняются без правок кода.

1. Откройте `assets/js/config.js`.
2. Заполните два поля:

```js
window.REVEAL_RELEASE = {
  owner: 'reveal-team',      // ник или организация
  repo: 'reveal-launcher',   // репозиторий с релизами
  assetPattern: /\.exe$/i,   // что считать установщиком
  fallbackVersion: '1.5.2',
  fallbackSize: '133 МБ'
};
```

3. Задеплойте страницу. Дальше цикл такой: залили новый установщик в GitHub → нажали «Publish release» → сайт сам показывает новую версию.

Что обновляется автоматически:

- все места с версией (шапка, карточка установки, сравнение, блок «бесплатно», таблица сборок) — из тега релиза (`v1.5.3` → `1.5.3`);
- размер установщика — из ассета `.exe`;
- кнопка «Скачать лаунчер» отдаёт файл по `browser_download_url`;
- «Зеркало» и «Changelog» в футере — ссылка на ассет и первая строка описания релиза.

Детали: репозиторий должен быть публичным; версия из кеша рисуется сразу, а сам GitHub опрашивается не чаще раза в 5 минут (кеш в `localStorage`, ключ `reveal_release`) — это бережёт лимит 60 запросов в час на IP. Если API недоступен или поля не заполнены — показываются `fallbackVersion` и `fallbackSize`.

## Конфиги

Секция `#configs` раздаёт готовые пресеты визуала. Каждая карточка — JSON-файл из `assets/configs/`, который лаунчер читает из `%appdata%\.revealvisual\game\config\revealvisuals\presets`.

- Карточка «КФГ by Zombi» — широкая: три скрина из `assets/img/configs/` с подписями (фон, небо, FPS) и лайтбоксом по клику.
- Скачивание — обычная ссылка с атрибутом `download` (`href="assets/configs/zombi.json"`).
- Чтобы добавить пресет: положите `имя.json` в `assets/configs/`, скопируйте карточку в `index.html` и поменяйте заголовок, описание, скрины и путь в `href`.
- Тестовый `assets/configs/test.json` остался в репозитории как эталон структуры, но на странице не выводится.

## Свой домен

Сайт живёт на GitHub Pages и открывается по адресу **https://revealvisuals.griefworlds.ru/**. В корне репозитория лежит `CNAME` с этим доменом, HTTPS включён принудительно.

Если домен нужно переехать:

1. В DNS-панели домена `griefworlds.ru` (сейчас это Vercel → Domains → `griefworlds.ru` → DNS Records) поставьте запись:

```
Тип:   CNAME
Имя:   revealvisuals
Значение: disgrief.github.io
TTL:   300 / Auto
```

2. После того как запись разойдётся, включите домен в Pages:

```bash
gh api -X PUT repos/DisGrief/RevealVisualsSite/pages \
  -f cname=revealvisuals.griefworlds.ru -f build_type=legacy
```

3. Дождитесь статуса `certificate approved` и включите принудительный HTTPS:

```bash
gh api -X PUT repos/DisGrief/RevealVisualsSite/pages -F https_enforced=true
```

Файл `CNAME` в корне репозитория делает то же самое — GitHub читает его при сборке. После привязки домена старый адрес `disgrief.github.io/RevealVisualsSite/` отдаёт 301 на кастомный домен.

## Деплой

Это статика: загрузите `index.html` и папку `assets` на GitHub Pages, Netlify, Vercel или любой веб-сервер. `server.mjs` для продакшена не нужен.

## Демо-моменты

- Кнопка «Скачать лаунчер» показывает прогресс и тост; файл она отдаёт после заполнения `owner`/`repo` в `assets/js/config.js`.
- «Зеркало» — прямая ссылка на Dropbox-копию установщика. URL живёт в `assets/js/config.js` (`mirrorUrl`), в разметке его нет: при наведении браузер показывает только адрес сайта.
- Ссылки соцсетей и служебные ссылки футера помечены `data-toast` и показывают демо-уведомление.
- Страница не связана с Mojang Studios и Microsoft.

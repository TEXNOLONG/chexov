# Чехов — Заказы

Офлайн PWA для официанта **Гастропаб Чехов** (Ярославль, Щапова 1).

## Стек

- **Frontend:** React 19 + Vite 8, Tailwind CSS 4, TypeScript
- **Офлайн:** Dexie (IndexedDB) + PWA (vite-plugin-pwa)
- **AI:** Express proxy (server.js :3001) → Groq API, или напрямую из APK с ключом из Профиля
- **Мобильный:** Capacitor Android APK

## Запуск

```bash
npm install
npm run dev
```

## Переменные окружения

| Переменная     | Обязательная | Описание                             |
|----------------|--------------|--------------------------------------|
| `GROQ_API_KEY` | Нет          | Groq proxy для браузера (dev режим)  |

В APK AI работает через ключ из Профиля (хранится в localStorage).

## Структура

```
src/
  App.tsx                — корневой компонент
  types.ts               — Tab: tables|menu|ai|profile|stats
  hooks/
    useProfile.ts        — профиль: имя, ставка, Groq key
    useOrders.ts
    useOnlineStatus.ts
  components/
    IntroScreen.tsx      — анимация первого входа («Привет, Михаил!»)
    MenuSearchBar.tsx    — поиск + фильтры (фиксированная полоса над скроллом)
    MenuView.tsx         — список/сетка блюд (controlled + selectable режимы)
    ProfileView.tsx      — профиль + календарь смен
    StatsView.tsx        — таймер смены, заработок, история
    AIView.tsx           — AI чат + голосовой ввод (Web Speech API)
    TablesView.tsx       — управление столами
    OrderPanel.tsx       — заказ по столу
    BottomNav.tsx        — 5 вкладок: Столы|Меню|AI|Профиль|Смена
  data/menu.json         — 275+ позиций меню
public/menu-images/      — фото блюд (.webp, bundled в APK)
server.js                — Groq API proxy (:3001, только dev)
```

## Цветовая схема

Apple-glass dark purple. Основные переменные:
- `--bg: #07050e`, `--accent: #a78bfa` (violet), `--success: #34d399`
- Никакого золота/жёлтого

## Функционал

### Профиль (`src/components/ProfileView.tsx`)
- Имя, ставка ₽/час, Groq API Key
- Календарь смен: 1 клик = запланировано, 2 = отработано (с часами), 3 = убрать
- Итог по месяцу: дни, часы, заработок

### Смена (`src/components/StatsView.tsx`)
- Живой таймер смены (ЧЧ:ММ:СС)
- Текущий заработок в реальном времени (ставка × часы)
- Диалог «Завершить смену» с полем часов и итогом
- История последних 30 смен

### AI (`src/components/AIView.tsx`)
- Текстовый + голосовой ввод (Web Speech API, lang: ru-RU)
- В браузере: proxy через /api/chat → server.js → Groq
- В APK: прямой вызов api.groq.com с ключом из Профиля

## APK — что важно знать

1. **Groq API Key** — единственная внешняя зависимость. Добавить в Профиль → ✏️
2. **Offline** — меню, заказы, история работают без интернета (IndexedDB + Service Worker)
3. **Картинки** — 275 webp в `public/menu-images/` — bundled в APK, ничего скачивать не нужно
4. **Java 21** — нужен для сборки (см. .agents/memory/android-build.md)

## User Preferences

- Имя: Михаил
- Часовая ставка: 150 ₽/час (константа `HOURLY_RATE` в StatsView.tsx, редактируется через Профиль)
- Тёмная тема, Apple-glass дизайн, deep purple
- Приложение используется только лично

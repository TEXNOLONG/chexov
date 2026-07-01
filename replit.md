# Чехов — Заказы

Офлайн PWA для официанта **Гастропаб Чехов** (Ярославль, Щапова 1).

## Стек

- **Frontend:** React 19 + Vite 8, Tailwind CSS 4, TypeScript
- **Офлайн:** Dexie (IndexedDB) + PWA (vite-plugin-pwa)
- **AI:** Express proxy (server.js :3001) → Groq API (llama-3.3-70b-versatile)
- **Мобильный:** Capacitor Android APK

## Запуск

```bash
npm install
npm run dev
```

Откройте в браузере / добавьте на главный экран телефона из той же Wi-Fi сети.

## Переменные окружения

| Переменная     | Обязательная | Описание                    |
|----------------|--------------|-----------------------------|
| `GROQ_API_KEY` | Нет          | Включает вкладку AI-ассистента |

Без `GROQ_API_KEY` приложение работает полностью — AI-вкладка просто недоступна.

## Структура

```
src/
  App.tsx              — корневой компонент, управление состоянием
  components/
    IntroScreen.tsx    — анимация первого входа
    MenuSearchBar.tsx  — поиск + фильтры меню (фиксированная полоса)
    MenuView.tsx       — список/сетка блюд
    StatsView.tsx      — смена: таймер, заработок, история
    TablesView.tsx     — управление столами
    OrderPanel.tsx     — заказ по столу
    AIView.tsx         — AI-ассистент
    BottomNav.tsx      — нижняя навигация
  hooks/               — useOrders, useOnlineStatus, useLongPress
  data/menu.json       — 275+ позиций меню
public/menu-images/    — фото блюд (.webp)
server.js              — Groq API proxy
```

## Функционал «Смена»

- Live-таймер смены
- Кнопка **Завершить смену** → диалог с подтверждением:
  - поле «Часов отработано» (предзаполнено из таймера, 0–24ч)
  - заработок = часы × 150 ₽/ч
- История последних 30 смен в `localStorage`

## Обновление меню

```bash
python scripts/build-menu.py
```

## User Preferences

- Часовая ставка: 150 ₽/час (константа `HOURLY_RATE` в StatsView.tsx)
- Тёмная тема (purple-dark), акцент: gold `#f5b400`
- Приложение используется только лично

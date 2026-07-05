---
name: Chekhov App Stack
description: Architecture, tech stack, and key patterns in the Chekhov waiter PWA
---

# Stack
- React 19 + Vite + TypeScript PWA (Capacitor Android wrapper)
- Dexie (IndexedDB) for orders persistence
- Tailwind CSS 4 via @import
- CSS variables in :root for theming

# Key files
- `src/App.tsx` — main shell, GoStopProvider wrapper, tab routing, fuzzy menu filtering
- `src/types.ts` — MenuItem, OrderItem, Order, Tab ('tables'|'menu'|'ai'|'profile'|'settings'|'stats')
- `src/data/menu.json` — 2750 lines, ~200+ items
- `src/components/MenuView.tsx` — grid/list cards with inline GO/Stop buttons, fuzzy search
- `src/components/OrderPanel.tsx` — full-screen order flow, serving course, wizard steps
- `src/components/AIView.tsx` — Groq chat (proxy or direct key)
- `src/components/SettingsView.tsx` — theme picker + menu editor
- `src/components/BottomNav.tsx` — 6-tab nav: tables/menu/ai/profile/settings/stats

# Key hooks
- `useGoStop` (GoStopContext) — GO/Stop sets in localStorage
- `useCookTime` — cook time per item in localStorage
- `useFuzzySearch` — Levenshtein fuzzy filter, 0-3 weighted score across name/category/description/composition/allergens
- `useTheme` — 5 themes (dark-purple/midnight/sunset/forest/light), applies CSS vars via style#chexov-theme
- `useMenuOverrides` — localStorage overrides for menu items + new custom items

# Menu data flow
baseMenu (menu.json) → applyOverrides(overrides, newItems) → merged menu in App → passed to MenuView
fuzzyFilter() replaces includes() search throughout

# GO/Stop UX
- Grid cards: inline GO/STOP buttons top-left corner of card image (always visible, no long-press)
- List rows: inline GO/STOP buttons on right side
- Long-press still opens DishModal with full details and toggle buttons
- Single tap on grid card: opens DishModal (no long press required)

# Themes
5 themes stored in chexov:theme localStorage key.
Applied via style#chexov-theme element on :root.
useTheme() hook must be called in App() to init on mount.

# Menu editor (SettingsView)
- Overrides: chexov:menu-overrides (id → Partial<MenuItem>)
- New items: chexov:menu-new-items (MenuItem[])
- Export: JSON download of full merged menu
- Reset: clears both localStorage keys

# Color scheme (default dark-purple)
--bg:#07050e --accent:#a78bfa (violet) --success:#34d399 --danger:#f87171

---
name: Chekhov App Stack
description: React+Vite PWA waiter app — tech stack, design system, and key architectural decisions
---

## Stack
- React 19 + Vite 8, Tailwind CSS 4, TypeScript
- Dexie (IndexedDB) for offline-first data
- Capacitor Android for APK
- Express proxy (server.js :3001) for Groq in browser dev; direct Groq API call from APK

## Tabs (types.ts)
`Tab = 'tables' | 'menu' | 'ai' | 'profile' | 'stats'` — 5 tabs, profile is new (left of stats)

## Design system
Apple-glass dark purple. **No gold/yellow.** Key vars:
- `--bg: #07050e` (near-black), `--accent: #a78bfa` (violet), `--success: #34d399`
- `.glow-card` — glass card with purple glow (use for main cards instead of plain glass-card)
- Background: 4-layer radial gradient purple glows

## AI architecture (APK-safe)
- `loadProfile().groqApiKey` → if set, calls `https://api.groq.com/openai/v1/chat/completions` directly (works in APK)
- Fallback: `/api/chat` proxy (browser dev only, won't work in APK without key)
- Voice input: Web Speech API, `lang: ru-RU`, result appended to textarea

## Menu search bar (sticky fix)
MenuView has two modes:
1. **Controlled** (App.tsx passes `filtered/filteredGrouped/query/category/viewMode`) — used for menu tab. Search bar rendered in `MenuSearchBar.tsx` ABOVE the scroll container in App.tsx (not inside scroll root). This fixes the sticky bug.
2. **Selectable** (OrderPanel) — self-contained with internal state and sticky bar inside its own scroll context.

## Calendar (ProfileView.tsx)
`chexov:calendar` in localStorage: `ShiftDay[]` with `{ date: 'YYYY-MM-DD', status: 'planned'|'worked', hours? }`
Click cycles: none → planned → worked (hours dialog) → none

## Intro screen
Shows "Привет, {profile.name}!" on first launch. Flag: `chexov:introDone = '1'` in localStorage.
`handleIntroDone` is `useCallback([], [])` — stable reference, won't restart timers on parent re-renders.

**Why:** Timer effect in IntroScreen depends on `onDone`; unstable reference restarts timers → intro never finishes.

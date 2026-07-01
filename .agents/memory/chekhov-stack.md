---
name: Chekhov Gastropub App Stack
description: Tech stack, key files, and architecture for the waiter app
---

# Stack
- React 19 + Vite 8 + TypeScript
- Tailwind CSS 4 (via @import 'tailwindcss')  
- Dexie (IndexedDB for offline orders)
- vite-plugin-pwa (Workbox service worker)
- Capacitor 7 (Android APK)
- Pollinations.ai (free AI, no API key)

# Key files
- src/data/menu.json — 275 menu items with image paths (image field = /menu-images/{id}.webp)
- public/menu-images/ — 275 webp food photos from original HTML file
- src/index.css — all CSS variables, animations, utility classes (no separate component CSS)
- capacitor.config.ts — appId: ru.chehovgastropub.orders

# Design system
- Dark theme: --bg #0a0806, --accent #d4a574 (gold), --success #6bbf87
- All animations defined in index.css as @keyframes
- CSS utility classes: .btn, .btn-accent, .btn-ghost, .btn-danger, .glass, .cat-pill, .order-item, .table-card

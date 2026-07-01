---
name: Groq AI Setup
description: How Groq AI is integrated — proxy server, endpoints, model, env var
---

**Architecture:** Express proxy in `server.js` (port 3001) — never expose the key to the browser.

**How it runs:** `npm run dev` uses concurrently: `node server.js` + `vite`. Vite proxies `/api` → `http://localhost:3001`.

**Endpoint:** `POST /api/chat` — accepts `{ messages: [...] }`, returns `{ content: "..." }`.

**Model:** `llama-3.3-70b-versatile` (fast, high quality). Alternative: `llama-3.1-8b-instant` for even faster responses.

**Secret:** `GROQ_API_KEY` in Replit Secrets (never in code or VITE_ vars).

**Why:** Groq gives sub-second AI responses vs Pollinations.ai which was slow and injected ads into responses.

**How to apply:** If AIView.tsx needs updating, it calls `/api/chat` (relative URL). If switching models, change `model` in `server.js` only.

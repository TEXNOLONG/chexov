import { useEffect, useState } from 'react'

export type ThemeId = 'dark-purple' | 'midnight' | 'sunset' | 'forest' | 'light'

export interface ThemeDef {
  id: ThemeId
  label: string
  preview: string[]  // 3 css color strings for swatch
}

export const THEMES: ThemeDef[] = [
  {
    id: 'dark-purple',
    label: 'Ночной',
    preview: ['#07050e', '#a78bfa', '#110d22'],
  },
  {
    id: 'midnight',
    label: 'Полночь',
    preview: ['#06060a', '#60a5fa', '#0f1120'],
  },
  {
    id: 'sunset',
    label: 'Закат',
    preview: ['#100800', '#f59e0b', '#1c1106'],
  },
  {
    id: 'forest',
    label: 'Лес',
    preview: ['#06100a', '#34d399', '#0c1f15'],
  },
  {
    id: 'light',
    label: 'Светлая',
    preview: ['#f5f5f7', '#7c3aed', '#ffffff'],
  },
]

const THEME_VARS: Record<ThemeId, string> = {
  'dark-purple': `
    --bg:#07050e;--surface-solid:#110d22;--surface-2s:#19143a;--surface-3s:#231b50;
    --glass-card:rgba(139,124,248,0.09);--glass-card-b:rgba(160,140,255,0.16);
    --glass-nav:rgba(7,5,14,0.88);--glass-header:rgba(9,7,20,0.84);
    --accent:#a78bfa;--accent-2:#c4b5fd;--accent-soft:rgba(167,139,250,0.16);
    --purple:#8b7cf8;--purple-2:#a78bfa;--purple-soft:rgba(139,124,248,0.18);--purple-glow:rgba(139,124,248,0.35);
    --text:#f0eeff;--text-2:rgba(240,238,255,0.60);--muted:rgba(240,238,255,0.30);
    --success:#34d399;--success-soft:rgba(52,211,153,0.14);
    --warning:#fb923c;--warning-soft:rgba(251,146,60,0.14);
    --danger:#f87171;--danger-soft:rgba(248,113,113,0.14);
    --border:rgba(167,139,250,0.14);--border-accent:rgba(167,139,250,0.32);
    color-scheme:dark;
  `,
  'midnight': `
    --bg:#06060a;--surface-solid:#0f1120;--surface-2s:#131830;--surface-3s:#1b2248;
    --glass-card:rgba(96,165,250,0.07);--glass-card-b:rgba(120,180,255,0.13);
    --glass-nav:rgba(6,6,10,0.92);--glass-header:rgba(8,8,18,0.88);
    --accent:#60a5fa;--accent-2:#93c5fd;--accent-soft:rgba(96,165,250,0.16);
    --purple:#60a5fa;--purple-2:#93c5fd;--purple-soft:rgba(96,165,250,0.14);--purple-glow:rgba(96,165,250,0.28);
    --text:#e8f0ff;--text-2:rgba(232,240,255,0.60);--muted:rgba(232,240,255,0.28);
    --success:#34d399;--success-soft:rgba(52,211,153,0.14);
    --warning:#fb923c;--warning-soft:rgba(251,146,60,0.14);
    --danger:#f87171;--danger-soft:rgba(248,113,113,0.14);
    --border:rgba(96,165,250,0.14);--border-accent:rgba(96,165,250,0.30);
    color-scheme:dark;
  `,
  'sunset': `
    --bg:#100800;--surface-solid:#1c1106;--surface-2s:#271908;--surface-3s:#37240a;
    --glass-card:rgba(245,158,11,0.09);--glass-card-b:rgba(252,191,73,0.15);
    --glass-nav:rgba(16,8,0,0.92);--glass-header:rgba(20,10,0,0.88);
    --accent:#f59e0b;--accent-2:#fcd34d;--accent-soft:rgba(245,158,11,0.18);
    --purple:#f59e0b;--purple-2:#fcd34d;--purple-soft:rgba(245,158,11,0.14);--purple-glow:rgba(245,158,11,0.32);
    --text:#fff8e6;--text-2:rgba(255,248,230,0.62);--muted:rgba(255,248,230,0.32);
    --success:#34d399;--success-soft:rgba(52,211,153,0.14);
    --warning:#fb923c;--warning-soft:rgba(251,146,60,0.14);
    --danger:#f87171;--danger-soft:rgba(248,113,113,0.14);
    --border:rgba(245,158,11,0.18);--border-accent:rgba(245,158,11,0.36);
    color-scheme:dark;
  `,
  'forest': `
    --bg:#06100a;--surface-solid:#0c1f15;--surface-2s:#112a1d;--surface-3s:#183d2b;
    --glass-card:rgba(52,211,153,0.08);--glass-card-b:rgba(52,211,153,0.14);
    --glass-nav:rgba(6,16,10,0.92);--glass-header:rgba(8,20,13,0.88);
    --accent:#34d399;--accent-2:#6ee7b7;--accent-soft:rgba(52,211,153,0.18);
    --purple:#34d399;--purple-2:#6ee7b7;--purple-soft:rgba(52,211,153,0.14);--purple-glow:rgba(52,211,153,0.28);
    --text:#e8fff4;--text-2:rgba(232,255,244,0.60);--muted:rgba(232,255,244,0.28);
    --success:#34d399;--success-soft:rgba(52,211,153,0.14);
    --warning:#fb923c;--warning-soft:rgba(251,146,60,0.14);
    --danger:#f87171;--danger-soft:rgba(248,113,113,0.14);
    --border:rgba(52,211,153,0.14);--border-accent:rgba(52,211,153,0.30);
    color-scheme:dark;
  `,
  'light': `
    --bg:#f5f5f7;--surface-solid:#ffffff;--surface-2s:#f0f0f5;--surface-3s:#e5e5ec;
    --glass-card:rgba(124,58,237,0.06);--glass-card-b:rgba(124,58,237,0.10);
    --glass-nav:rgba(245,245,247,0.92);--glass-header:rgba(255,255,255,0.88);
    --accent:#7c3aed;--accent-2:#5b21b6;--accent-soft:rgba(124,58,237,0.14);
    --purple:#7c3aed;--purple-2:#5b21b6;--purple-soft:rgba(124,58,237,0.10);--purple-glow:rgba(124,58,237,0.22);
    --text:#1a1a2e;--text-2:rgba(26,26,46,0.65);--muted:rgba(26,26,46,0.40);
    --success:#059669;--success-soft:rgba(5,150,105,0.12);
    --warning:#d97706;--warning-soft:rgba(217,119,6,0.12);
    --danger:#dc2626;--danger-soft:rgba(220,38,38,0.12);
    --border:rgba(124,58,237,0.14);--border-accent:rgba(124,58,237,0.30);
    color-scheme:light;
  `,
}

const STORAGE_KEY = 'chexov:theme'

function loadTheme(): ThemeId {
  const v = localStorage.getItem(STORAGE_KEY)
  if (v && THEME_VARS[v as ThemeId]) return v as ThemeId
  return 'dark-purple'
}

function applyTheme(id: ThemeId) {
  const vars = THEME_VARS[id]
  // Replace all CSS variables on :root via a style element
  let el = document.getElementById('chexov-theme') as HTMLStyleElement | null
  if (!el) {
    el = document.createElement('style')
    el.id = 'chexov-theme'
    document.head.appendChild(el)
  }
  el.textContent = `:root { ${vars} }`
  // Also update body background gradient for dark/light
  if (id === 'light') {
    document.body.style.backgroundImage = 'none'
    document.body.style.backgroundColor = '#f5f5f7'
  } else if (id === 'midnight') {
    document.body.style.backgroundImage = `
      radial-gradient(ellipse 110% 65% at 5% 0%, rgba(30,60,180,0.20) 0%, transparent 60%),
      radial-gradient(ellipse 80% 55% at 95% 100%, rgba(20,40,140,0.15) 0%, transparent 55%)
    `
    document.body.style.backgroundColor = ''
  } else if (id === 'sunset') {
    document.body.style.backgroundImage = `
      radial-gradient(ellipse 110% 65% at 5% 0%, rgba(200,80,10,0.28) 0%, transparent 60%),
      radial-gradient(ellipse 80% 55% at 95% 100%, rgba(160,50,5,0.18) 0%, transparent 55%)
    `
    document.body.style.backgroundColor = ''
  } else if (id === 'forest') {
    document.body.style.backgroundImage = `
      radial-gradient(ellipse 110% 65% at 5% 0%, rgba(10,120,60,0.22) 0%, transparent 60%),
      radial-gradient(ellipse 80% 55% at 95% 100%, rgba(5,90,45,0.15) 0%, transparent 55%)
    `
    document.body.style.backgroundColor = ''
  } else {
    document.body.style.backgroundImage = ''
    document.body.style.backgroundColor = ''
  }
}

export function useTheme() {
  const [themeId, setThemeIdState] = useState<ThemeId>(loadTheme)

  useEffect(() => {
    applyTheme(themeId)
  }, [themeId])

  // Apply on mount
  useEffect(() => {
    applyTheme(loadTheme())
  }, [])

  function setTheme(id: ThemeId) {
    localStorage.setItem(STORAGE_KEY, id)
    setThemeIdState(id)
    applyTheme(id)
  }

  return { themeId, setTheme }
}

/** Apply theme immediately (no React, for initial load) */
export function initTheme() {
  applyTheme(loadTheme())
}

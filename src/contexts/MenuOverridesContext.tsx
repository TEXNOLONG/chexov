import { createContext, useContext, useState, type ReactNode } from 'react'
import type { MenuItem } from '../types'

const KEY = 'chexov:menu-overrides'
const NEW_KEY = 'chexov:menu-new-items'

export type MenuOverride = Partial<Omit<MenuItem, 'id'>>

function loadOverrides(): Record<string, MenuOverride> {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') } catch { return {} }
}
function loadNewItems(): MenuItem[] {
  try { return JSON.parse(localStorage.getItem(NEW_KEY) ?? '[]') } catch { return [] }
}
function saveOverrides(o: Record<string, MenuOverride>) {
  localStorage.setItem(KEY, JSON.stringify(o))
}
function saveNewItems(items: MenuItem[]) {
  localStorage.setItem(NEW_KEY, JSON.stringify(items))
}

export function applyOverrides(base: MenuItem[], overrides: Record<string, MenuOverride>, newItems: MenuItem[]): MenuItem[] {
  const result = base.map((item) => {
    const ov = overrides[item.id]
    return ov ? { ...item, ...ov } : item
  })
  return [...result, ...newItems]
}

interface Ctx {
  overrides: Record<string, MenuOverride>
  newItems: MenuItem[]
  setOverride: (id: string, partial: MenuOverride) => void
  removeOverride: (id: string) => void
  addItem: (item: MenuItem) => void
  updateNewItem: (id: string, partial: Partial<MenuItem>) => void
  removeNewItem: (id: string) => void
  resetAll: () => void
}

const MenuOverridesCtx = createContext<Ctx | null>(null)

export function MenuOverridesProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverridesState] = useState<Record<string, MenuOverride>>(loadOverrides)
  const [newItems, setNewItemsState] = useState<MenuItem[]>(loadNewItems)

  function setOverride(id: string, partial: MenuOverride) {
    const next = { ...overrides, [id]: { ...(overrides[id] ?? {}), ...partial } }
    setOverridesState(next); saveOverrides(next)
  }
  function removeOverride(id: string) {
    const next = { ...overrides }; delete next[id]
    setOverridesState(next); saveOverrides(next)
  }
  function addItem(item: MenuItem) {
    const next = [...newItems, item]; setNewItemsState(next); saveNewItems(next)
  }
  function updateNewItem(id: string, partial: Partial<MenuItem>) {
    const next = newItems.map((i) => i.id === id ? { ...i, ...partial } : i)
    setNewItemsState(next); saveNewItems(next)
  }
  function removeNewItem(id: string) {
    const next = newItems.filter((i) => i.id !== id); setNewItemsState(next); saveNewItems(next)
  }
  function resetAll() {
    setOverridesState({}); setNewItemsState([]); saveOverrides({}); saveNewItems([])
  }

  return (
    <MenuOverridesCtx.Provider value={{ overrides, newItems, setOverride, removeOverride, addItem, updateNewItem, removeNewItem, resetAll }}>
      {children}
    </MenuOverridesCtx.Provider>
  )
}

export function useMenuOverrides() {
  const ctx = useContext(MenuOverridesCtx)
  if (!ctx) throw new Error('useMenuOverrides must be inside MenuOverridesProvider')
  return ctx
}

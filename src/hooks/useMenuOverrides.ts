import { useState } from 'react'
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

/** Merge base menu with localStorage overrides + new items */
export function applyOverrides(base: MenuItem[], overrides: Record<string, MenuOverride>, newItems: MenuItem[]): MenuItem[] {
  const result = base.map((item) => {
    const ov = overrides[item.id]
    return ov ? { ...item, ...ov } : item
  })
  return [...result, ...newItems]
}

export function useMenuOverrides() {
  const [overrides, setOverridesState] = useState<Record<string, MenuOverride>>(loadOverrides)
  const [newItems, setNewItemsState] = useState<MenuItem[]>(loadNewItems)

  function setOverride(id: string, partial: MenuOverride) {
    const next = { ...overrides, [id]: { ...(overrides[id] ?? {}), ...partial } }
    setOverridesState(next)
    saveOverrides(next)
  }

  function removeOverride(id: string) {
    const next = { ...overrides }
    delete next[id]
    setOverridesState(next)
    saveOverrides(next)
  }

  function addItem(item: MenuItem) {
    const next = [...newItems, item]
    setNewItemsState(next)
    saveNewItems(next)
  }

  function updateNewItem(id: string, partial: Partial<MenuItem>) {
    const next = newItems.map((i) => i.id === id ? { ...i, ...partial } : i)
    setNewItemsState(next)
    saveNewItems(next)
  }

  function removeNewItem(id: string) {
    const next = newItems.filter((i) => i.id !== id)
    setNewItemsState(next)
    saveNewItems(next)
  }

  function resetAll() {
    setOverridesState({})
    setNewItemsState([])
    saveOverrides({})
    saveNewItems([])
  }

  return { overrides, newItems, setOverride, removeOverride, addItem, updateNewItem, removeNewItem, resetAll }
}

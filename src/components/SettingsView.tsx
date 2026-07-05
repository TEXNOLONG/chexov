import { useState, useMemo } from 'react'
import { THEMES, useTheme } from '../contexts/ThemeContext'
import { useMenuOverrides } from '../contexts/MenuOverridesContext'
import { menu as baseMenu, DRINK_CATS } from './MenuView'
import type { MenuItem } from '../types'
import { formatPrice } from '../utils'
import { fuzzyFilter } from '../hooks/useFuzzySearch'

/* ─── Item editor dialog ───────────────────────── */
function ItemEditor({
  item,
  isNew,
  onSave,
  onDelete,
  onClose,
}: {
  item: MenuItem
  isNew: boolean
  onSave: (id: string, data: Partial<MenuItem>) => void
  onDelete?: (id: string) => void
  onClose: () => void
}) {
  const [name, setName] = useState(item.name)
  const [category, setCategory] = useState(item.category)
  const [price, setPrice] = useState(String(item.price))
  const [description, setDescription] = useState(item.description)
  const [composition, setComposition] = useState(item.composition)
  const [allergens, setAllergens] = useState(item.allergens)

  const allCats = useMemo(() => [...new Set(baseMenu.map((m) => m.category))], [])

  function save() {
    const priceNum = Math.max(0, parseFloat(price) || 0)
    onSave(item.id, { name: name.trim() || item.name, category, price: priceNum, description, composition, allergens })
    onClose()
  }

  const field = (label: string, value: string, onChange: (v: string) => void, opts?: { multiline?: boolean; type?: string }) => (
    <div key={label}>
      <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--muted)' }}>
        {label}
      </label>
      {opts?.multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
          style={{ background: 'rgba(139,124,248,0.07)', border: '1px solid var(--border)', color: 'var(--text)' }}
        />
      ) : (
        <input
          type={opts?.type ?? 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
          style={{ background: 'rgba(139,124,248,0.07)', border: '1px solid var(--border)', color: 'var(--text)' }}
        />
      )}
    </div>
  )

  return (
    <div className="fixed inset-0 z-[300] flex items-end"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}>
      <div className="w-full max-h-[92dvh] overflow-y-auto rounded-t-[28px]"
        style={{ background: 'var(--surface-solid)', animation: 'sheetUp 0.32s cubic-bezier(0.32,1,0.45,1) both' }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--surface-3s)' }} />
        </div>
        <div className="px-4 pb-8 space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-black flex-1">{isNew ? 'Новое блюдо' : 'Редактировать'}</h3>
            <button type="button" onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
              style={{ background: 'var(--surface-3s)', color: 'var(--muted)' }}>✕</button>
          </div>

          {field('Название', name, setName)}

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--muted)' }}>
              Категория
            </label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none appearance-none"
              style={{ background: 'rgba(139,124,248,0.07)', border: '1px solid var(--border)', color: 'var(--text)' }}>
              {allCats.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {field('Цена (₽)', price, setPrice, { type: 'number' })}
          {field('Описание', description, setDescription, { multiline: true })}
          {field('Состав', composition, setComposition, { multiline: true })}
          {field('Аллергены', allergens, setAllergens)}

          <div className="flex gap-2 pt-2">
            {onDelete && (
              <button type="button"
                onClick={() => { onDelete(item.id); onClose() }}
                className="py-3 px-4 rounded-2xl font-bold text-sm"
                style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
                Удалить
              </button>
            )}
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-2xl font-bold text-sm"
              style={{ background: 'rgba(139,124,248,0.09)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>
              Отмена
            </button>
            <button type="button" onClick={save}
              className="flex-1 py-3 rounded-2xl font-bold text-sm"
              style={{ background: 'var(--accent)', color: '#07050e' }}>
              Сохранить
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Main Settings View ───────────────────────── */
export function SettingsView() {
  const { themeId, setTheme } = useTheme()
  const { overrides, newItems, setOverride, removeOverride, addItem, updateNewItem, removeNewItem, resetAll } = useMenuOverrides()
  const [editItem, setEditItem] = useState<{ item: MenuItem; isNew: boolean } | null>(null)
  const [menuSearch, setMenuSearch] = useState('')
  const [section, setSection] = useState<'themes' | 'menu'>('themes')
  const [confirmReset, setConfirmReset] = useState(false)

  const allItems: MenuItem[] = useMemo(() => {
    const patched = baseMenu.map((item) => {
      const ov = overrides[item.id]
      return ov ? { ...item, ...ov } : item
    })
    return [...patched, ...newItems]
  }, [overrides, newItems])

  const displayItems = useMemo(() => {
    const q = menuSearch.trim()
    if (!q) return allItems
    return fuzzyFilter(q, allItems)
  }, [allItems, menuSearch])

  function handleSaveItem(id: string, data: Partial<MenuItem>) {
    // Check if it's a new item
    const isNew = newItems.some((i) => i.id === id)
    if (isNew) {
      updateNewItem(id, data)
    } else {
      setOverride(id, data)
    }
  }

  function handleDeleteItem(id: string) {
    const isNew = newItems.some((i) => i.id === id)
    if (isNew) {
      removeNewItem(id)
    } else {
      removeOverride(id)
    }
  }

  function handleAddNew() {
    const newId = `custom-${Date.now()}`
    const item: MenuItem = {
      id: newId,
      name: 'Новое блюдо',
      category: 'Холодные закуски',
      description: '',
      composition: '',
      allergens: '',
      price: 0,
      image: null,
    }
    addItem(item)
    setEditItem({ item, isNew: true })
  }

  function exportMenu() {
    const json = JSON.stringify(allItems, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `chekhov-menu-${new Date().toISOString().slice(0,10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const hasOverrides = Object.keys(overrides).length > 0 || newItems.length > 0

  return (
    <div className="space-y-4 pb-4">
      {editItem && (
        <ItemEditor
          item={editItem.item}
          isNew={editItem.isNew}
          onSave={handleSaveItem}
          onDelete={editItem.isNew || overrides[editItem.item.id] !== undefined
            ? (id) => handleDeleteItem(id)
            : undefined
          }
          onClose={() => setEditItem(null)}
        />
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl" style={{ background: 'var(--surface-2s)' }}>
        {([['themes', 'Темы'], ['menu', 'Редактор меню']] as const).map(([id, label]) => (
          <button key={id} type="button" onClick={() => setSection(id)}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={section === id
              ? { background: 'var(--accent)', color: '#07050e' }
              : { color: 'var(--muted)' }
            }>
            {label}
          </button>
        ))}
      </div>

      {/* ── Themes ── */}
      {section === 'themes' && (
        <div className="space-y-3">
          <p className="text-xs" style={{ color: 'var(--muted)' }}>Выберите цветовую тему приложения</p>
          <div className="grid grid-cols-1 gap-2">
            {THEMES.map((theme) => (
              <button key={theme.id} type="button"
                onClick={() => setTheme(theme.id)}
                className="flex items-center gap-3 rounded-2xl p-3 text-left transition active:scale-[0.98]"
                style={{
                  background: themeId === theme.id ? 'var(--accent-soft)' : 'var(--surface-solid)',
                  border: themeId === theme.id ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                }}>
                {/* Swatch */}
                <div className="flex rounded-xl overflow-hidden shrink-0 border border-[var(--border)]">
                  {theme.preview.map((c, i) => (
                    <div key={i} style={{ background: c, width: 24, height: 40 }} />
                  ))}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm" style={{ color: 'var(--text)' }}>{theme.label}</div>
                </div>
                {themeId === theme.id && (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: 'var(--accent)' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3" style={{ color: '#07050e' }}>
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Menu Editor ── */}
      {section === 'menu' && (
        <div className="space-y-3">
          {/* Actions row */}
          <div className="flex gap-2">
            <button type="button" onClick={handleAddNew}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition active:scale-95"
              style={{ background: 'var(--accent)', color: '#07050e' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
              </svg>
              Добавить
            </button>
            <button type="button" onClick={exportMenu}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition active:scale-95"
              style={{ background: 'var(--surface-solid)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round"/>
              </svg>
              Экспорт JSON
            </button>
            {hasOverrides && (
              <button type="button" onClick={() => setConfirmReset(true)}
                className="ml-auto flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-bold transition active:scale-95"
                style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
                Сбросить
              </button>
            )}
          </div>

          {hasOverrides && (
            <div className="rounded-2xl px-3 py-2 text-xs"
              style={{ background: 'var(--accent-soft)', border: '1px solid var(--border-accent)', color: 'var(--accent)' }}>
              Изменено: {Object.keys(overrides).length} блюд · Добавлено: {newItems.length}
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: 'var(--muted)' }}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/>
            </svg>
            <input value={menuSearch} onChange={(e) => setMenuSearch(e.target.value)}
              placeholder="Поиск блюда…"
              className="search-input" />
            {menuSearch && (
              <button type="button" onClick={() => setMenuSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full text-sm"
                style={{ background: 'var(--surface-3s)', color: 'var(--muted)' }}>✕</button>
            )}
          </div>

          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            {displayItems.length} из {allItems.length} блюд · нажмите для редактирования
          </p>

          {/* Items list */}
          <div className="space-y-2">
            {displayItems.map((item) => {
              const isCustom = newItems.some((i) => i.id === item.id)
              const isModified = !!overrides[item.id]
              const isDrink = DRINK_CATS.has(item.category)
              return (
                <button key={item.id} type="button"
                  onClick={() => setEditItem({ item, isNew: isCustom })}
                  className="w-full flex items-center gap-3 rounded-2xl p-3 text-left transition active:scale-[0.98]"
                  style={{ background: 'var(--surface-solid)', border: `1px solid ${isCustom ? 'var(--accent)' : isModified ? 'var(--border-accent)' : 'var(--border)'}` }}>
                  {item.image ? (
                    <img src={item.image} alt="" className="shrink-0 w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                      style={{ background: 'var(--surface-2s)' }}>
                      {isDrink ? '🍷' : '🍽'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{item.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{item.category}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-black" style={{ color: 'var(--accent)' }}>
                      {item.price > 0 ? formatPrice(item.price) : '—'}
                    </div>
                    {isCustom && <div className="text-[9px] mt-0.5 font-bold" style={{ color: 'var(--accent)' }}>НОВОЕ</div>}
                    {isModified && !isCustom && <div className="text-[9px] mt-0.5 font-bold" style={{ color: 'var(--muted)' }}>ИЗМЕНЕНО</div>}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Reset confirm */}
      {confirmReset && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center px-6"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={() => setConfirmReset(false)}>
          <div className="w-full max-w-sm rounded-3xl p-6 space-y-4"
            style={{ background: 'var(--surface-solid)', border: '1px solid var(--border)' }}
            onClick={(e) => e.stopPropagation()}>
            <div className="text-base font-black">Сбросить все изменения?</div>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Все правки меню и добавленные блюда будут удалены. Вернётся оригинальное меню.
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setConfirmReset(false)}
                className="flex-1 py-3 rounded-2xl font-bold text-sm"
                style={{ background: 'rgba(139,124,248,0.09)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>
                Отмена
              </button>
              <button type="button"
                onClick={() => { resetAll(); setConfirmReset(false) }}
                className="flex-1 py-3 rounded-2xl font-bold text-sm"
                style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
                Сбросить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

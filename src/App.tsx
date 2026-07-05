import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getActiveOrderForTable } from './db'
import { AIView } from './components/AIView'
import { BottomNav } from './components/BottomNav'
import { IntroScreen } from './components/IntroScreen'
import { MenuSearchBar } from './components/MenuSearchBar'
import { OrderPanel } from './components/OrderPanel'
import { MenuView, DRINK_CATS, menu } from './components/MenuView'
import { ProfileView } from './components/ProfileView'
import { StatsView } from './components/StatsView'
import { TablesView } from './components/TablesView'
import { useOrders, useTableCount } from './hooks/useOrders'
import { useOnlineStatus } from './hooks/useOnlineStatus'
import { useProfile } from './hooks/useProfile'
import { groupMenuByCategory } from './utils'
import type { Order, Tab } from './types'

function hasSeenIntro() {
  return localStorage.getItem('chexov:introDone') === '1'
}

function App() {
  const orders = useOrders()
  const [tableCount, setTableCount] = useTableCount()
  const [tab, setTab] = useState<Tab>('tables')
  const [selectedTable, setSelectedTable] = useState<number | null>(null)
  const [activeOrder, setActiveOrder] = useState<Order | null | undefined>(undefined)
  const [refreshKey, setRefreshKey] = useState(0)
  const online = useOnlineStatus()
  const [onlineBanner, setOnlineBanner] = useState<'back' | 'lost' | null>(null)
  const prevOnlineRef = useRef<boolean | null>(null)
  const [profile] = useProfile()

  // Intro — mark as seen immediately so killing mid-animation doesn't replay it
  const [showIntro, setShowIntro] = useState(() => {
    const seen = hasSeenIntro()
    if (!seen) localStorage.setItem('chexov:introDone', '1')
    return !seen
  })

  // Menu filter state (lifted so search bar lives outside scroll container — fixes sticky bug)
  const allCats = useMemo(() => [...new Set(menu.map((m) => m.category))], [])
  const foodCats = useMemo(() => allCats.filter((c) => !DRINK_CATS.has(c)), [allCats])
  const drinkCats = useMemo(() => allCats.filter((c) => DRINK_CATS.has(c)), [allCats])
  const [menuQuery, setMenuQuery] = useState('')
  const [menuSection, setMenuSection] = useState<'food' | 'drinks'>('food')
  const [menuCategory, setMenuCategory] = useState('all')
  const [menuViewMode, setMenuViewMode] = useState<'grid' | 'list'>('grid')
  const menuVisibleCats = menuSection === 'food' ? foodCats : drinkCats

  const menuFiltered = useMemo(() => {
    const q = menuQuery.trim().toLowerCase()
    return menu.filter((item) => {
      if (q) {
        return (
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.composition.toLowerCase().includes(q) ||
          item.allergens.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
        )
      }
      const inSection = menuSection === 'food' ? !DRINK_CATS.has(item.category) : DRINK_CATS.has(item.category)
      if (!inSection) return false
      return menuCategory === 'all' || item.category === menuCategory
    })
  }, [menuQuery, menuSection, menuCategory])

  const menuFilteredGrouped = useMemo(() => groupMenuByCategory(menuFiltered), [menuFiltered])

  useEffect(() => {
    if (prevOnlineRef.current === null) { prevOnlineRef.current = online; return }
    if (prevOnlineRef.current === online) return
    prevOnlineRef.current = online
    setOnlineBanner(online ? 'back' : 'lost')
    const t = setTimeout(() => setOnlineBanner(null), 3000)
    return () => clearTimeout(t)
  }, [online])

  useEffect(() => {
    if (selectedTable == null) { setActiveOrder(undefined); return }
    setActiveOrder(undefined)
    getActiveOrderForTable(selectedTable).then((o) => setActiveOrder(o ?? null))
  }, [selectedTable, orders, refreshKey])

  const handleIntroDone = useCallback(() => {
    setShowIntro(false)
  }, [])

  const tabLabel: Record<Tab, string> = {
    tables: 'Заказы',
    menu: 'Меню',
    ai: 'AI',
    profile: profile.name,
    stats: 'Смена',
  }

  return (
    <>
      {showIntro && <IntroScreen onDone={handleIntroDone} />}

      <div
        className="flex flex-col"
        style={{ height: '100dvh', overflow: 'hidden', background: 'var(--bg)', color: 'var(--text)' }}
      >
        {/* Online/offline banner */}
        {onlineBanner && (
          <div
            className="shrink-0 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold"
            style={
              onlineBanner === 'back'
                ? { background: 'var(--success)', color: '#000' }
                : { background: 'var(--danger-soft)', color: 'var(--danger)' }
            }
          >
            {onlineBanner === 'back' ? '✅ Соединение восстановлено' : '📵 Офлайн — данные сохранены'}
          </div>
        )}

        {/* ── Header ── */}
        <header
          className="shrink-0 glass border-b border-[var(--border)] z-40"
          style={{
            paddingTop: 'max(0.9rem, env(safe-area-inset-top))',
            paddingBottom: '0.7rem',
            paddingLeft: '1.1rem',
            paddingRight: '1.1rem',
          }}
        >
          <div className="mx-auto max-w-3xl flex flex-col items-center text-center gap-0.5">
            {/* Brand */}
            <div className="flex items-center gap-1.5">
              <div
                className="w-5 h-5 rounded-[6px] flex items-center justify-center shrink-0"
                style={{ background: 'var(--accent)' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="#07050e" strokeWidth={2.5} className="w-3 h-3">
                  <path d="M3 11l7-7 4 4 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 11v10H3V11" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-[9px] font-black uppercase tracking-[0.24em]" style={{ color: 'var(--accent)' }}>
                Гастропаб Чехов
              </span>
              {!online && <span className="badge badge-danger">офлайн</span>}
            </div>

            {/* Title + table controls */}
            <div className="flex items-center gap-2">
              <h1 className="text-[22px] font-black leading-tight tracking-tight">{tabLabel[tab]}</h1>
              {tab === 'tables' && (
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => setTableCount(Math.max(1, tableCount - 1))}
                    className="w-7 h-7 rounded-xl flex items-center justify-center font-bold active:scale-90 transition glass-card text-sm">−</button>
                  <span className="w-6 text-center text-sm font-black tabular-nums">{tableCount}</span>
                  <button type="button" onClick={() => setTableCount(Math.min(40, tableCount + 1))}
                    className="w-7 h-7 rounded-xl flex items-center justify-center font-bold active:scale-90 transition glass-card text-sm">+</button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Menu search bar (fixed between header and content) ── */}
        {tab === 'menu' && (
          <MenuSearchBar
            query={menuQuery}
            onQueryChange={setMenuQuery}
            section={menuSection}
            onSectionChange={setMenuSection}
            category={menuCategory}
            onCategoryChange={setMenuCategory}
            viewMode={menuViewMode}
            onViewModeToggle={() => setMenuViewMode(v => v === 'grid' ? 'list' : 'grid')}
            visibleCats={menuVisibleCats}
          />
        )}

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain" id="scroll-root">
          <div className="mx-auto max-w-3xl px-4 pt-3 pb-32">
            {tab === 'tables' && (
              <TablesView tableCount={tableCount} orders={orders} onSelectTable={setSelectedTable} />
            )}
            {tab === 'menu' && (
              <MenuView
                filtered={menuFiltered}
                filteredGrouped={menuFilteredGrouped}
                query={menuQuery}
                category={menuCategory}
                viewMode={menuViewMode}
              />
            )}
            {tab === 'ai'      && <AIView />}
            {tab === 'profile' && <ProfileView />}
            {tab === 'stats'   && <StatsView orders={orders} />}
          </div>
        </div>

        {!selectedTable && <BottomNav active={tab} onChange={setTab} />}

        {selectedTable != null && (
          <OrderPanel
            tableNumber={selectedTable}
            order={activeOrder}
            onClose={() => setSelectedTable(null)}
            onChanged={() => setRefreshKey((k) => k + 1)}
          />
        )}
      </div>
    </>
  )
}

export default App

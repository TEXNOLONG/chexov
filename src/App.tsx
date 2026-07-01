import { useEffect, useRef, useState } from 'react'
import { getActiveOrderForTable } from './db'
import { AIView } from './components/AIView'
import { BottomNav } from './components/BottomNav'
import { OrderPanel } from './components/OrderPanel'
import { MenuView } from './components/MenuView'
import { StatsView } from './components/StatsView'
import { TablesView } from './components/TablesView'
import { useOrders, useTableCount } from './hooks/useOrders'
import { useOnlineStatus } from './hooks/useOnlineStatus'
import type { Order, Tab } from './types'

const TAB_TITLES: Record<Tab, { title: string; sub: string }> = {
  tables: { title: 'Заказы',  sub: 'Управление столами' },
  menu:   { title: 'Меню',    sub: 'Все блюда и напитки' },
  ai:     { title: 'AI',      sub: 'Умный ассистент' },
  stats:  { title: 'Смена',   sub: 'Статистика и выручка' },
}

function App() {
  const orders = useOrders()
  const [tableCount, setTableCount] = useTableCount()
  const [tab, setTab] = useState<Tab>('tables')
  const [selectedTable, setSelectedTable] = useState<number | null>(null)
  // undefined=loading, null=confirmed free, Order=active order
  const [activeOrder, setActiveOrder] = useState<Order | null | undefined>(undefined)
  const [refreshKey, setRefreshKey] = useState(0)
  const online = useOnlineStatus()
  const [onlineBanner, setOnlineBanner] = useState<'back' | 'lost' | null>(null)
  const prevOnlineRef = useRef<boolean | null>(null)

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

  const { title, sub } = TAB_TITLES[tab]

  return (
    /* Full-height flex column — allows inner scroll container for proper sticky */
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
          paddingBottom: '0.75rem',
          paddingLeft: '1.1rem',
          paddingRight: '1.1rem',
        }}
      >
        <div className="mx-auto max-w-3xl flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 mb-0.5">
              <div
                className="w-7 h-7 rounded-[10px] shrink-0 flex items-center justify-center"
                style={{ background: 'var(--accent)' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth={2.4} className="w-4 h-4">
                  <path d="M3 11l7-7 4 4 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 11v10H3V11" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: 'var(--accent)' }}>
                Гастропаб Чехов
              </span>
              {!online && <span className="badge badge-danger">офлайн</span>}
            </div>
            <h1 className="text-xl font-black leading-tight">{title}</h1>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>{sub}</p>
          </div>

          {tab === 'tables' && (
            <div className="shrink-0 text-right">
              <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--muted)' }}>Столов</div>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setTableCount(Math.max(1, tableCount - 1))}
                  className="w-8 h-8 rounded-xl flex items-center justify-center font-bold active:scale-90 transition glass-card">
                  −
                </button>
                <span className="w-8 text-center text-base font-black">{tableCount}</span>
                <button type="button" onClick={() => setTableCount(Math.min(40, tableCount + 1))}
                  className="w-8 h-8 rounded-xl flex items-center justify-center font-bold active:scale-90 transition glass-card">
                  +
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── Scrollable content ── */}
      {/* This div is the real scroll root — sticky children stick inside here */}
      <div className="flex-1 overflow-y-auto overscroll-contain" id="scroll-root">
        <div className="mx-auto max-w-3xl px-4 pt-3 pb-32">
          {tab === 'tables' && (
            <TablesView tableCount={tableCount} orders={orders} onSelectTable={setSelectedTable} />
          )}
          {tab === 'menu'  && <MenuView />}
          {tab === 'ai'    && <AIView />}
          {tab === 'stats' && <StatsView orders={orders} />}
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
  )
}

export default App

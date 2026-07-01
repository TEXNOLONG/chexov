import { useEffect, useMemo, useState } from 'react'
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
  tables: { title: 'Заказы', sub: 'Управление столами' },
  menu:   { title: 'Меню', sub: 'Все блюда и напитки' },
  ai:     { title: 'AI Ассистент', sub: 'Умный помощник' },
  stats:  { title: 'Смена', sub: 'Статистика и выручка' },
}

function App() {
  const orders = useOrders()
  const [tableCount, setTableCount] = useTableCount()
  const [tab, setTab] = useState<Tab>('tables')
  const [selectedTable, setSelectedTable] = useState<number | null>(null)
  const [activeOrder, setActiveOrder] = useState<Order | undefined>()
  const [refreshKey, setRefreshKey] = useState(0)
  const online = useOnlineStatus()
  const [showOfflineBanner, setShowOfflineBanner] = useState(false)

  useEffect(() => {
    if (!online) {
      setShowOfflineBanner(true)
    } else {
      const t = setTimeout(() => setShowOfflineBanner(false), 3000)
      return () => clearTimeout(t)
    }
  }, [online])

  useEffect(() => {
    if (selectedTable == null) { setActiveOrder(undefined); return }
    getActiveOrderForTable(selectedTable).then(setActiveOrder)
  }, [selectedTable, orders, refreshKey])

  const { title, sub } = TAB_TITLES[tab]

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Offline banner */}
      {showOfflineBanner && (
        <div className={`fixed top-0 inset-x-0 z-[100] flex items-center justify-center gap-2 py-2.5 text-xs font-semibold transition-all duration-500 ${
          online
            ? 'bg-[var(--success)] text-white'
            : 'bg-[#2a1010] text-[var(--danger)] border-b border-[var(--danger)]/30'
        }`}>
          {online ? '✅ Соединение восстановлено' : '📵 Офлайн — данные сохранены'}
        </div>
      )}

      {/* Header */}
      <header
        className="sticky top-0 z-40 glass border-b border-[var(--border)]"
        style={{
          paddingTop: showOfflineBanner ? 'calc(max(0.75rem, env(safe-area-inset-top)) + 2.2rem)' : 'max(0.75rem, env(safe-area-inset-top))',
          paddingBottom: '0.75rem',
          paddingLeft: '1rem',
          paddingRight: '1rem',
          transition: 'padding-top 0.3s ease',
        }}
      >
        <div className="mx-auto max-w-3xl flex items-center justify-between gap-3">
          {/* Logo + title */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              {/* Logo dot */}
              <div className="w-6 h-6 rounded-lg bg-[var(--accent)] flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="#0a0806" strokeWidth={2.5} className="w-3.5 h-3.5">
                  <path d="M3 11l7-7 4 4 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 11v10H3V11" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--accent)]">
                Гастропаб Чехов
              </span>
              {!online && (
                <span className="badge badge-danger">офлайн</span>
              )}
            </div>
            <h1 className="text-xl font-black leading-tight">{title}</h1>
            <p className="text-xs text-[var(--muted)]">{sub}</p>
          </div>

          {/* Table count control */}
          {tab === 'tables' && (
            <div className="text-right shrink-0">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] mb-1">Столов</div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setTableCount(Math.max(1, tableCount - 1))}
                  className="w-8 h-8 rounded-xl bg-[var(--surface-2)] text-[var(--muted)] flex items-center justify-center font-bold active:scale-90 transition"
                >−</button>
                <span className="w-8 text-center text-base font-black">{tableCount}</span>
                <button
                  type="button"
                  onClick={() => setTableCount(Math.min(40, tableCount + 1))}
                  className="w-8 h-8 rounded-xl bg-[var(--surface-2)] text-[var(--muted)] flex items-center justify-center font-bold active:scale-90 transition"
                >+</button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-3xl px-4 py-4 pb-28">
        {tab === 'tables' && (
          <TablesView
            tableCount={tableCount}
            orders={orders}
            onSelectTable={(num) => setSelectedTable(num)}
          />
        )}
        {tab === 'menu' && <MenuView />}
        {tab === 'ai' && <AIView />}
        {tab === 'stats' && <StatsView orders={orders} />}
      </main>

      {/* Bottom nav (only when no table selected) */}
      {!selectedTable && <BottomNav active={tab} onChange={setTab} />}

      {/* Order panel */}
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

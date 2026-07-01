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
      // hide banner after coming back online with a short delay
      const t = setTimeout(() => setShowOfflineBanner(false), 3000)
      return () => clearTimeout(t)
    }
  }, [online])

  useEffect(() => {
    if (selectedTable == null) {
      setActiveOrder(undefined)
      return
    }
    getActiveOrderForTable(selectedTable).then(setActiveOrder)
  }, [selectedTable, orders, refreshKey])

  const headerInfo = useMemo(() => {
    if (tab === 'tables') return { subtitle: 'Управление столами', emoji: '🪑' }
    if (tab === 'menu') return { subtitle: 'Методичка Гастропаб Чехов', emoji: '📋' }
    if (tab === 'ai') return { subtitle: 'Ваш умный ассистент', emoji: '🤖' }
    return { subtitle: 'Статистика текущей смены', emoji: '📊' }
  }, [tab])

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* Offline / back-online banner */}
      {showOfflineBanner && (
        <div
          className={`fixed top-0 inset-x-0 z-[100] flex items-center justify-center gap-2 py-2 text-xs font-semibold transition-all duration-500 ${
            online
              ? 'bg-[var(--success)] text-white'
              : 'bg-[#3a1e1e] text-[#ffb4b4]'
          }`}
        >
          {online ? (
            <>✅ Соединение восстановлено</>
          ) : (
            <>📵 Офлайн — данные сохранены локально</>
          )}
        </div>
      )}

      <header
        className="sticky top-0 z-40 border-b border-[var(--border)] glass px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]"
        style={{ marginTop: showOfflineBanner ? '2rem' : 0 }}
      >
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base">{headerInfo.emoji}</span>
                <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">
                  Гастропаб Чехов
                </div>
                {!online && (
                  <span className="rounded-full bg-[#3a1e1e] px-1.5 py-0.5 text-[9px] font-semibold uppercase text-[#ffb4b4]">
                    офлайн
  </span>
                )}
              </div>
              <h1 className="text-lg font-semibold leading-tight">
                {tab === 'tables' ? 'Заказы' : tab === 'menu' ? 'Меню' : tab === 'ai' ? 'AI Ассистент' : 'Смена'}
              </h1>
              <p className="text-xs text-[var(--muted)]">{headerInfo.subtitle}</p>
            </div>
            {tab === 'tables' && (
              <label className="text-right text-xs text-[var(--muted)]">
                <span className="block">Столов</span>
                <input
                  type="number"
                  min={1}
                  max={40}
                  value={tableCount}
                  onChange={(e) => setTableCount(Number(e.target.value) || 1)}
                  className="mt-1 block w-16 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-center text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                />
              </label>
            )}
          </div>
        </div>
      </header>

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

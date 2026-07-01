import { useEffect, useMemo, useState } from 'react'
import { getActiveOrderForTable } from './db'
import { BottomNav } from './components/BottomNav'
import { OrderPanel } from './components/OrderPanel'
import { MenuView } from './components/MenuView'
import { StatsView } from './components/StatsView'
import { TablesView } from './components/TablesView'
import { useOrders, useTableCount } from './hooks/useOrders'
import type { Order, Tab } from './types'

function App() {
  const orders = useOrders()
  const [tableCount, setTableCount] = useTableCount()
  const [tab, setTab] = useState<Tab>('tables')
  const [selectedTable, setSelectedTable] = useState<number | null>(null)
  const [activeOrder, setActiveOrder] = useState<Order | undefined>()
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (selectedTable == null) {
      setActiveOrder(undefined)
      return
    }
    getActiveOrderForTable(selectedTable).then(setActiveOrder)
  }, [selectedTable, orders, refreshKey])

  const subtitle = useMemo(() => {
    if (tab === 'tables') return 'Выберите стол для заказа'
    if (tab === 'menu') return 'Методичка Гастропаб Чехов'
    return 'Статистика текущей смены'
  }, [tab])

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="sticky top-0 z-40 border-b border-[#342920] bg-[#120e0b]/95 px-4 py-4 backdrop-blur">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-[var(--accent)]">Гастропаб Чехов</div>
              <h1 className="text-xl font-semibold">Заказы</h1>
              <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p>
            </div>
            {tab === 'tables' && (
              <label className="text-right text-xs text-[var(--muted)]">
                Столов
                <input
                  type="number"
                  min={1}
                  max={40}
                  value={tableCount}
                  onChange={(e) => setTableCount(Number(e.target.value) || 1)}
                  className="mt-1 block w-16 rounded-lg border border-[#342920] bg-[var(--surface)] px-2 py-1 text-center text-sm text-[var(--text)]"
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

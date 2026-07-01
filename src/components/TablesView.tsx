import { useMemo } from 'react'
import type { Order } from '../types'
import { formatPrice, orderItemsCount, orderTotal } from '../utils'
import { cn } from '../utils'

interface Props {
  tableCount: number
  orders: Order[]
  onSelectTable: (tableNumber: number) => void
}

export function TablesView({ tableCount, orders, onSelectTable }: Props) {
  const byTable = useMemo(() => {
    const map = new Map<number, Order>()
    for (const order of orders) {
      if (order.status === 'active' || order.status === 'served') {
        map.set(order.tableNumber, order)
      }
    }
    return map
  }, [orders])

  const busyCount = byTable.size
  const totalTables = tableCount

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="flex gap-3 animate-fade-in">
        <div className="flex-1 rounded-2xl bg-[var(--surface)] border border-[var(--border)] px-4 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] mb-1">Занято</div>
          <div className="text-2xl font-bold text-[var(--accent)]">{busyCount}</div>
        </div>
        <div className="flex-1 rounded-2xl bg-[var(--surface)] border border-[var(--border)] px-4 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] mb-1">Свободно</div>
          <div className="text-2xl font-bold text-[var(--text)]">{totalTables - busyCount}</div>
        </div>
        <div className="flex-1 rounded-2xl bg-[var(--surface)] border border-[var(--border)] px-4 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] mb-1">Всего</div>
          <div className="text-2xl font-bold text-[var(--text-2)]">{totalTables}</div>
        </div>
      </div>

      {/* Tables grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: tableCount }, (_, i) => i + 1).map((num, idx) => {
          const order = byTable.get(num)
          const busy = Boolean(order)
          const isServed = order?.status === 'served'
          const total = order ? orderTotal(order.items) : 0
          const count = order ? orderItemsCount(order.items) : 0

          return (
            <button
              key={num}
              type="button"
              onClick={() => onSelectTable(num)}
              className={cn(
                'table-card text-left',
                busy
                  ? isServed ? 'table-card-served' : 'table-card-busy'
                  : 'table-card-free',
              )}
              style={{
                animation: `tableAppear 0.3s ease-out ${Math.min(idx * 0.04, 0.4)}s both`,
              }}
            >
              {/* Top row */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">Стол</div>
                  <div className={cn(
                    'text-4xl font-black leading-none mt-0.5',
                    busy
                      ? isServed ? 'text-[var(--success)]' : 'text-[var(--accent)]'
                      : 'text-[var(--text)]',
                  )}>
                    {num}
                  </div>
                </div>

                {/* Status dot */}
                <div className={cn(
                  'w-3 h-3 rounded-full mt-1',
                  busy
                    ? isServed
                      ? 'bg-[var(--success)] shadow-[0_0_8px_var(--success)]'
                      : 'bg-[var(--accent)] shadow-[0_0_8px_var(--accent-glow)]'
                    : 'bg-[var(--surface-3)]',
                )} />
              </div>

              {/* Bottom info */}
              {order ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--muted)]">{count} поз.</span>
                    {isServed && (
                      <span className="badge badge-served">оплата</span>
                    )}
                  </div>
                  <div className={cn(
                    'text-base font-bold',
                    isServed ? 'text-[var(--success)]' : 'text-[var(--accent)]',
                  )}>
                    {formatPrice(total)}
                  </div>
                  {/* Mini progress */}
                  {order.items.length > 0 && (
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${(order.items.filter(i => i.served).length / order.items.length) * 100}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-[var(--muted)] font-medium">Свободен</div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

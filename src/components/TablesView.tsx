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

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {Array.from({ length: tableCount }, (_, i) => i + 1).map((num) => {
        const order = byTable.get(num)
        const busy = Boolean(order)
        const isServed = order?.status === 'served'

        return (
          <button
            key={num}
            type="button"
            onClick={() => onSelectTable(num)}
            className={cn(
              'rounded-2xl border p-4 text-left transition-all active:scale-[0.97]',
              busy
                ? isServed
                  ? 'border-[var(--success)] bg-[rgba(107,159,123,0.1)] shadow-md'
                  : 'border-[var(--accent)] bg-[var(--accent-soft)] shadow-md'
                : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--muted)]',
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">Стол</div>
                <div className="text-3xl font-bold leading-tight">{num}</div>
              </div>
              <div
                className={cn(
                  'mt-1 h-2.5 w-2.5 rounded-full',
                  busy
                    ? isServed
                      ? 'bg-[var(--success)] shadow-[0_0_6px_var(--success)]'
                      : 'bg-[var(--accent)] shadow-[0_0_6px_var(--accent)]'
                    : 'bg-[var(--surface-3)]',
                )}
              />
            </div>
            {order ? (
              <div className="mt-3 space-y-1">
                <div className="text-xs text-[var(--muted)]">{orderItemsCount(order.items)} поз.</div>
                <div className="text-sm font-semibold text-[var(--text)]">{formatPrice(orderTotal(order.items))}</div>
                {isServed && (
                  <div className="badge badge-served mt-1">ждёт оплаты</div>
                )}
              </div>
            ) : (
              <div className="mt-3 text-xs text-[var(--muted)]">Свободен</div>
            )}
          </button>
        )
      })}
    </div>
  )
}

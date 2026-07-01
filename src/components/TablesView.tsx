import { useMemo } from 'react'
import type { Order } from '../types'
import { formatPrice, orderItemsCount, orderTotal } from '../utils'
import { Card } from './Card'

interface Props {
  tableCount: number
  orders: Order[]
  onSelectTable: (tableNumber: number) => void
}

export function TablesView({ tableCount, orders, onSelectTable }: Props) {
  const activeByTable = useMemo(() => {
    const map = new Map<number, Order>()
    for (const order of orders) {
      if (order.status === 'active') map.set(order.tableNumber, order)
    }
    return map
  }, [orders])

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {Array.from({ length: tableCount }, (_, i) => i + 1).map((num) => {
        const order = activeByTable.get(num)
        const busy = Boolean(order)

        return (
          <Card
            key={num}
            onClick={() => onSelectTable(num)}
            className={busy ? 'border-[var(--accent)] bg-[var(--accent-soft)]/40' : ''}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Стол</div>
                <div className="text-2xl font-semibold">{num}</div>
              </div>
              <div
                className={`mt-1 h-2.5 w-2.5 rounded-full ${busy ? 'bg-[var(--accent)]' : 'bg-[#3d4a3d]'}`}
              />
            </div>
            {order ? (
              <div className="mt-3 space-y-1 text-sm text-[var(--muted)]">
                <div>{orderItemsCount(order.items)} поз.</div>
                <div className="font-medium text-[var(--text)]">{formatPrice(orderTotal(order.items))}</div>
              </div>
            ) : (
              <div className="mt-3 text-sm text-[var(--muted)]">Свободен</div>
            )}
          </Card>
        )
      })}
    </div>
  )
}

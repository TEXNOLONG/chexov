import { useEffect, useState } from 'react'
import { liveQuery } from 'dexie'
import { db } from '../db'
import type { Order } from '../types'

export function useOrders(): Order[] {
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    const sub = liveQuery(() => db.orders.orderBy('updatedAt').reverse().toArray()).subscribe({
      next: setOrders,
    })
    return () => sub.unsubscribe()
  }, [])

  return orders
}

export function useTableCount(): [number, (count: number) => void] {
  const [count, setCountState] = useState(() => db.getTableCount())

  const setCount = (value: number) => {
    db.setTableCount(value)
    setCountState(value)
  }

  return [count, setCount]
}

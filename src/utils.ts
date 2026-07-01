import type { Order, OrderItem, ShiftStats } from './types'

export function formatPrice(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatTime(ts: number): string {
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(ts)
}

export function formatDateTime(ts: number): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(ts)
}

export function orderTotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
}

export function orderItemsCount(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0)
}

export function getShiftStart(): number {
  const stored = localStorage.getItem('chexov:shiftStart')
  if (stored) return Number(stored)

  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now.getTime()
}

export function resetShift() {
  localStorage.setItem('chexov:shiftStart', String(Date.now()))
}

export function calcStats(orders: Order[]): ShiftStats {
  const shiftStart = getShiftStart()
  const shiftOrders = orders.filter((o) => o.createdAt >= shiftStart)

  return {
    ordersCount: shiftOrders.length,
    activeCount: shiftOrders.filter((o) => o.status === 'active').length,
    servedCount: shiftOrders.filter((o) => o.status === 'served').length,
    paidCount: shiftOrders.filter((o) => o.status === 'paid').length,
    totalRevenue: shiftOrders
      .filter((o) => o.status === 'paid')
      .reduce((sum, o) => sum + orderTotal(o.items), 0),
    itemsSold: shiftOrders
      .filter((o) => o.status === 'paid')
      .reduce((sum, o) => sum + orderItemsCount(o.items), 0),
  }
}

export function groupMenuByCategory<T extends { category: string }>(items: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const list = map.get(item.category) ?? []
    list.push(item)
    map.set(item.category, list)
  }
  return map
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export type OrderStatus = 'active' | 'served' | 'paid'

export interface MenuItem {
  id: string
  name: string
  category: string
  description: string
  composition: string
  allergens: string
  price: number
}

export interface OrderItem {
  id: string
  menuItemId: string
  name: string
  price: number
  quantity: number
  note?: string
  served: boolean
}

export interface Order {
  id: string
  tableNumber: number
  status: OrderStatus
  items: OrderItem[]
  guestCount?: number
  note?: string
  createdAt: number
  updatedAt: number
  closedAt?: number
}

export interface TableInfo {
  number: number
  label?: string
}

export interface ShiftStats {
  ordersCount: number
  activeCount: number
  servedCount: number
  paidCount: number
  totalRevenue: number
  itemsSold: number
}

export type Tab = 'tables' | 'menu' | 'stats' | 'ai'

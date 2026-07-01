import Dexie, { type EntityTable } from 'dexie'
import type { Order } from './types'

class ChexovDB extends Dexie {
  orders!: EntityTable<Order, 'id'>

  constructor() {
    super('chexov-orders')
    this.version(1).stores({
      orders: 'id, tableNumber, status, createdAt, updatedAt',
    })
  }

  getTableCount(): number {
    return Number(localStorage.getItem('chexov:tableCount') ?? '16')
  }

  setTableCount(count: number) {
    localStorage.setItem('chexov:tableCount', String(count))
  }
}

export const db = new ChexovDB()

export async function getActiveOrderForTable(tableNumber: number): Promise<Order | undefined> {
  return db.orders.where({ tableNumber, status: 'active' }).first()
}

export async function saveOrder(order: Order): Promise<void> {
  await db.orders.put(order)
}

export async function deleteOrder(id: string): Promise<void> {
  await db.orders.delete(id)
}

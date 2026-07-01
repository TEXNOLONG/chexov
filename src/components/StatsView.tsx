import { useEffect, useRef, useState } from 'react'
import type { Order } from '../types'
import { calcStats, formatDateTime, formatPrice, getShiftStart, orderItemsCount, orderTotal, resetShift } from '../utils'
import { Card } from './Card'

const HOURLY_RATE = 150 // ₽/час

interface Props {
  orders: Order[]
}

function useShiftTimer(shiftStart: number) {
  const [elapsed, setElapsed] = useState(Date.now() - shiftStart)
  useEffect(() => {
    const id = setInterval(() => setElapsed(Date.now() - shiftStart), 1000)
    return () => clearInterval(id)
  }, [shiftStart])
  return elapsed
}

function formatElapsed(ms: number) {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function msToHours(ms: number) {
  return parseFloat((ms / 3600000).toFixed(2))
}

export function StatsView({ orders }: Props) {
  const [, forceUpdate] = useState(0)
  const [shiftStart, setShiftStart] = useState(getShiftStart)
  const elapsed = useShiftTimer(shiftStart)
  const stats = calcStats(orders)
  const [showEndModal, setShowEndModal] = useState(false)

  const recentPaid = orders
    .filter((o) => o.status === 'paid' && o.createdAt >= shiftStart)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 15)

  function handleEndShift() {
    setShowEndModal(true)
  }

  function handleConfirmEnd(hoursWorked: number) {
    const earnings = Math.round(hoursWorked * HOURLY_RATE)
    // Save shift record
    const record = {
      date: shiftStart,
      hours: hoursWorked,
      earnings,
      orders: stats.paidCount,
      revenue: stats.totalRevenue,
    }
    const history = JSON.parse(localStorage.getItem('chexov:shiftHistory') ?? '[]')
    history.unshift(record)
    localStorage.setItem('chexov:shiftHistory', JSON.stringify(history.slice(0, 30)))

    resetShift()
    const newStart = getShiftStart()
    setShiftStart(newStart)
    setShowEndModal(false)
    forceUpdate((v) => v + 1)
  }

  return (
    <div className="space-y-4">
      {showEndModal && (
        <EndShiftModal
          elapsed={elapsed}
          stats={stats}
          onConfirm={handleConfirmEnd}
          onCancel={() => setShowEndModal(false)}
        />
      )}

      {/* ── Timer card ── */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ borderColor: 'var(--border)', background: 'var(--surface-solid)' }}
      >
        {/* Timer strip */}
        <div
          className="px-4 pt-4 pb-3 flex items-center justify-between gap-3"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
              Смена идёт
            </div>
            <div
              className="text-3xl font-black tabular-nums mt-0.5 tracking-tight"
              style={{ color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}
            >
              {formatElapsed(elapsed)}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
              с {formatDateTime(shiftStart)}
            </div>
          </div>

          <button
            type="button"
            onClick={handleEndShift}
            className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold transition active:scale-95"
            style={{ background: 'var(--danger-soft)', color: 'var(--danger)', border: '1px solid rgba(255,69,58,0.25)' }}
          >
            Завершить смену
          </button>
        </div>

        {/* Earnings preview */}
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="text-xs" style={{ color: 'var(--muted)' }}>
            Заработок ~{HOURLY_RATE}₽/ч
          </div>
          <div className="text-base font-black" style={{ color: 'var(--success)' }}>
            ≈ {formatPrice(Math.floor(msToHours(elapsed) * HOURLY_RATE))}
          </div>
        </div>
      </div>

      {/* ── Stats grid ── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-4">
        <div className="mb-3 text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
          За смену
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="Всего заказов" value={String(stats.ordersCount)} />
          <Stat label="Активных" value={String(stats.activeCount)} accent="accent" />
          <Stat label="На оплате" value={String(stats.servedCount)} accent="warning" />
          <Stat label="Оплачено" value={String(stats.paidCount)} accent="success" />
          <Stat label="Позиций продано" value={String(stats.itemsSold)} />
          <Stat label="Выручка" value={formatPrice(stats.totalRevenue)} accent="main" large />
        </div>
      </div>

      {/* Progress bar */}
      {stats.ordersCount > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] px-4 py-3">
          <div className="mb-2 flex justify-between text-xs text-[var(--muted)]">
            <span>Оплачено из открытых</span>
            <span className="font-medium text-[var(--text)]">
              {stats.paidCount} / {stats.ordersCount}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-3s)]">
            <div
              className="h-full rounded-full bg-[var(--success)] transition-all duration-700"
              style={{ width: `${(stats.paidCount / stats.ordersCount) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Shift history ── */}
      <ShiftHistory />

      {/* ── Recent paid orders ── */}
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
          Последние оплаченные
        </h3>
        {recentPaid.length ? (
          <div className="space-y-2">
            {recentPaid.map((order) => (
              <Card key={order.id}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-sm font-bold text-[var(--accent)]">
                      {order.tableNumber}
                    </div>
                    <div>
                      <div className="text-sm font-medium">Стол {order.tableNumber}</div>
                      <div className="text-xs text-[var(--muted)]">
                        {orderItemsCount(order.items)} поз. · {formatDateTime(order.updatedAt)}
                      </div>
                    </div>
                  </div>
                  <div className="font-semibold text-[var(--accent)]">
                    {formatPrice(orderTotal(order.items))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <div className="text-4xl">📊</div>
              <p className="text-sm text-[var(--muted)]">Пока нет оплаченных заказов за смену</p>
            </div>
          </Card>
        )}
      </section>
    </div>
  )
}

/* ── End Shift Modal ─────────────────────────────── */
function EndShiftModal({
  elapsed, stats, onConfirm, onCancel,
}: {
  elapsed: number
  stats: { paidCount: number; totalRevenue: number }
  onConfirm: (hours: number) => void
  onCancel: () => void
}) {
  const defaultHours = parseFloat(msToHours(elapsed).toFixed(1))
  const [hours, setHours] = useState(String(defaultHours))
  const earnings = Math.round((parseFloat(hours) || 0) * HOURLY_RATE)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-5 animate-slide-up"
        style={{ background: '#1a1630', border: '1px solid rgba(139,124,248,0.22)', paddingBottom: 'max(1.25rem,env(safe-area-inset-bottom))' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-5">
          <div className="text-2xl mb-2">🏁</div>
          <div className="text-lg font-black">Завершить смену?</div>
          <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
            Это сбросит счётчики текущей смены
          </div>
        </div>

        {/* Shift summary */}
        <div className="rounded-2xl p-3 mb-4 space-y-1.5" style={{ background: 'rgba(139,124,248,0.08)', border: '1px solid var(--border)' }}>
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--muted)' }}>Оплачено заказов</span>
            <span className="font-bold">{stats.paidCount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--muted)' }}>Выручка</span>
            <span className="font-bold text-[var(--accent)]">{formatPrice(stats.totalRevenue)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--muted)' }}>Отработано (таймер)</span>
            <span className="font-bold">{formatElapsed(elapsed)}</span>
          </div>
        </div>

        {/* Hours input */}
        <div className="mb-4">
          <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--muted)' }}>
            Часов отработано
          </label>
          <input
            ref={inputRef}
            type="number"
            min="0"
            max="24"
            step="0.5"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="w-full text-center text-3xl font-black rounded-2xl py-3 outline-none"
            style={{ background: 'rgba(139,124,248,0.10)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
          <div className="text-center mt-2 text-base font-black" style={{ color: 'var(--success)' }}>
            = {formatPrice(earnings)}
          </div>
          <div className="text-center text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            {HOURLY_RATE}₽ × {hours || 0} ч
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl font-bold text-sm"
            style={{ background: 'rgba(139,124,248,0.10)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={() => {
              const raw = parseFloat(hours)
              const clamped = Number.isFinite(raw) ? Math.max(0, Math.min(24, raw)) : 0
              onConfirm(clamped)
            }}
            className="flex-1 py-3 rounded-2xl font-bold text-sm"
            style={{ background: 'var(--danger-soft)', border: '1px solid rgba(255,69,58,0.3)', color: 'var(--danger)' }}
          >
            Завершить
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Shift history ─────────────────────────────── */
function ShiftHistory() {
  const history: Array<{
    date: number; hours: number; earnings: number; orders: number; revenue: number
  }> = JSON.parse(localStorage.getItem('chexov:shiftHistory') ?? '[]').slice(0, 5)

  if (!history.length) return null

  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
        История смен
      </h3>
      <div className="space-y-2">
        {history.map((s, i) => (
          <div
            key={i}
            className="rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
            style={{ background: 'var(--surface-solid)', border: '1px solid var(--border)' }}
          >
            <div>
              <div className="text-sm font-semibold">{formatDateTime(s.date)}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                {s.hours}ч · {s.orders} заказов
              </div>
            </div>
            <div className="text-right">
              <div className="text-base font-black" style={{ color: 'var(--success)' }}>
                {formatPrice(s.earnings)}
              </div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>
                выручка {formatPrice(s.revenue)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ── Stat card ─────────────────────────────────── */
function Stat({
  label, value, accent, large,
}: {
  label: string; value: string; accent?: 'main' | 'success' | 'warning' | 'accent'; large?: boolean
}) {
  const color =
    accent === 'main' ? 'text-[var(--accent)]' :
    accent === 'success' ? 'text-[var(--success)]' :
    accent === 'warning' ? 'text-[var(--warning)]' :
    accent === 'accent' ? 'text-[var(--accent)]' :
    'text-[var(--text)]'

  return (
    <div className="rounded-xl bg-[var(--surface-2s)] p-3">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">{label}</div>
      <div className={`mt-1 font-bold ${large ? 'text-xl' : 'text-lg'} ${color}`}>{value}</div>
    </div>
  )
}

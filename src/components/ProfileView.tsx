import { useState, useMemo } from 'react'
import { useProfile } from '../hooks/useProfile'
import { formatPrice } from '../utils'

/* ── Calendar data types ─────────────────────── */
export interface ShiftDay {
  date: string   // 'YYYY-MM-DD'
  status: 'planned' | 'worked'
  hours?: number
}

function loadCalendar(): ShiftDay[] {
  try { return JSON.parse(localStorage.getItem('chexov:calendar') ?? '[]') } catch { return [] }
}

function saveCalendar(days: ShiftDay[]) {
  localStorage.setItem('chexov:calendar', JSON.stringify(days))
}

function today() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function toKey(year: number, month: number, day: number) {
  return `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
}

const WEEKDAYS = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']
const MONTHS   = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']

/* ── Hours dialog ───────────────────────────── */
function HoursDialog({
  date, current, rate, onSave, onCancel,
}: { date: string; current?: number; rate: number; onSave:(h:number)=>void; onCancel:()=>void }) {
  const [val, setVal] = useState(String(current ?? 8))
  const h = Math.max(0, Math.min(24, parseFloat(val) || 0))
  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.70)', backdropFilter: 'blur(8px)' }}
      onClick={onCancel}>
      <div className="w-full max-w-sm rounded-3xl p-5 animate-slide-up"
        style={{ background:'#110d22', border:'1px solid rgba(167,139,250,0.22)', paddingBottom:'max(1.25rem,env(safe-area-inset-bottom))' }}
        onClick={e=>e.stopPropagation()}>
        <div className="text-center mb-5">
          <div className="text-xl mb-1">✅</div>
          <div className="text-base font-black">Отметить как отработанный</div>
          <div className="text-xs mt-0.5" style={{ color:'var(--muted)' }}>{date}</div>
        </div>
        <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color:'var(--muted)' }}>
          Часов отработано
        </label>
        <input type="number" min="0" max="24" step="0.5" value={val}
          onChange={e=>setVal(e.target.value)}
          className="w-full text-center text-3xl font-black rounded-2xl py-3 outline-none mb-2"
          style={{ background:'rgba(139,124,248,0.10)', border:'1px solid var(--border)', color:'var(--text)' }}
        />
        <div className="text-center text-sm font-black mb-4" style={{ color:'var(--success)' }}>
          = {formatPrice(Math.round(h * rate))}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel}
            className="flex-1 py-3 rounded-2xl font-bold text-sm"
            style={{ background:'rgba(139,124,248,0.10)', border:'1px solid var(--border)', color:'var(--text-2)' }}>
            Отмена
          </button>
          <button type="button" onClick={() => onSave(h)}
            className="flex-1 py-3 rounded-2xl font-bold text-sm"
            style={{ background:'var(--success-soft)', border:'1px solid rgba(52,211,153,0.3)', color:'var(--success)' }}>
            Сохранить
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Main component ─────────────────────────── */
export function ProfileView() {
  const [profile, setProfile] = useProfile()
  const [editing, setEditing] = useState(false)
  const [nameVal, setNameVal] = useState(profile.name)
  const [rateVal, setRateVal] = useState(String(profile.hourlyRate))
  const [keyVal, setKeyVal] = useState(profile.groqApiKey)

  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [calData, setCalData] = useState<ShiftDay[]>(loadCalendar)
  const [hoursDialog, setHoursDialog] = useState<string | null>(null)

  const todayStr = today()

  /* Build calendar grid */
  const { firstWeekday, daysInMonth } = useMemo(() => {
    const d = new Date(viewYear, viewMonth, 1)
    let fw = d.getDay() - 1 // Mon=0
    if (fw < 0) fw = 6
    return { firstWeekday: fw, daysInMonth: new Date(viewYear, viewMonth+1, 0).getDate() }
  }, [viewYear, viewMonth])

  const calMap = useMemo(() => {
    const m = new Map<string, ShiftDay>()
    calData.forEach(d => m.set(d.date, d))
    return m
  }, [calData])

  /* Month stats */
  const monthStats = useMemo(() => {
    let planned = 0, worked = 0, hours = 0
    for (let d = 1; d <= daysInMonth; d++) {
      const key = toKey(viewYear, viewMonth, d)
      const s = calMap.get(key)
      if (!s) continue
      if (s.status === 'planned') planned++
      if (s.status === 'worked') { worked++; hours += (s.hours ?? 0) }
    }
    return { planned, worked, hours, earnings: Math.round(hours * profile.hourlyRate) }
  }, [calMap, daysInMonth, viewYear, viewMonth, profile.hourlyRate])

  function handleDayClick(day: number) {
    const key = toKey(viewYear, viewMonth, day)
    const existing = calMap.get(key)
    if (!existing) {
      // None → planned
      const next = calData.filter(d => d.date !== key).concat({ date: key, status: 'planned' })
      setCalData(next); saveCalendar(next)
    } else if (existing.status === 'planned') {
      // Planned → worked (open hours dialog)
      setHoursDialog(key)
    } else {
      // Worked → none
      const next = calData.filter(d => d.date !== key)
      setCalData(next); saveCalendar(next)
    }
  }

  function handleSaveHours(key: string, hours: number) {
    const next = calData.filter(d => d.date !== key).concat({ date: key, status: 'worked', hours })
    setCalData(next); saveCalendar(next); setHoursDialog(null)
  }

  function saveProfile() {
    const rate = Math.max(0, parseFloat(rateVal) || 150)
    setProfile({ name: nameVal.trim() || 'Михаил', hourlyRate: rate, groqApiKey: keyVal.trim() })
    setEditing(false)
  }

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1) }
    else setViewMonth(m => m-1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1) }
    else setViewMonth(m => m+1)
  }

  return (
    <div className="space-y-4 pb-2">
      {hoursDialog && (
        <HoursDialog
          date={hoursDialog}
          current={calMap.get(hoursDialog)?.hours}
          rate={profile.hourlyRate}
          onSave={h => handleSaveHours(hoursDialog, h)}
          onCancel={() => setHoursDialog(null)}
        />
      )}

      {/* ── Profile card ── */}
      <div className="glow-card rounded-3xl p-5">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 text-2xl font-black"
            style={{ background:'linear-gradient(135deg,rgba(167,139,250,0.25),rgba(139,124,248,0.45))', border:'1px solid rgba(167,139,250,0.35)', color:'var(--accent-2)' }}>
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xl font-black leading-tight">{profile.name}</div>
            <div className="text-xs mt-0.5" style={{ color:'var(--muted)' }}>Официант · Гастропаб Чехов</div>
            <div className="text-xs mt-1 font-semibold" style={{ color:'var(--accent)' }}>
              {formatPrice(profile.hourlyRate)}/час
            </div>
          </div>
          <button type="button" onClick={() => { setEditing(e=>!e); setNameVal(profile.name); setRateVal(String(profile.hourlyRate)); setKeyVal(profile.groqApiKey) }}
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl"
            style={{ background:'rgba(167,139,250,0.12)', border:'1px solid var(--border)', color:'var(--accent)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Edit form */}
        {editing && (
          <div className="mt-4 pt-4 space-y-3 animate-fade-in" style={{ borderTop:'1px solid var(--border)' }}>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color:'var(--muted)' }}>Имя</label>
              <input value={nameVal} onChange={e=>setNameVal(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{ background:'rgba(139,124,248,0.09)', border:'1px solid var(--border)', color:'var(--text)' }} />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color:'var(--muted)' }}>Ставка (₽/час)</label>
              <input type="number" value={rateVal} onChange={e=>setRateVal(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{ background:'rgba(139,124,248,0.09)', border:'1px solid var(--border)', color:'var(--text)' }} />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color:'var(--muted)' }}>Groq API Key (для AI в APK)</label>
              <input type="password" value={keyVal} onChange={e=>setKeyVal(e.target.value)}
                placeholder="gsk_..."
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none font-mono"
                style={{ background:'rgba(139,124,248,0.09)', border:'1px solid var(--border)', color:'var(--text)' }} />
              <p className="text-[10px] mt-1" style={{ color:'var(--muted)' }}>
                Бесплатно на groq.com — нужен только для APK
              </p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditing(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                style={{ background:'rgba(139,124,248,0.09)', border:'1px solid var(--border)', color:'var(--text-2)' }}>
                Отмена
              </button>
              <button type="button" onClick={saveProfile}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                style={{ background:'var(--accent)', color:'#07050e' }}>
                Сохранить
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Calendar ── */}
      <div className="glow-card rounded-3xl p-4">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button type="button" onClick={prevMonth}
            className="w-9 h-9 flex items-center justify-center rounded-xl"
            style={{ background:'rgba(139,124,248,0.10)', color:'var(--accent)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round"/>
            </svg>
          </button>
          <div className="text-base font-black">{MONTHS[viewMonth]} {viewYear}</div>
          <button type="button" onClick={nextMonth}
            className="w-9 h-9 flex items-center justify-center rounded-xl"
            style={{ background:'rgba(139,124,248,0.10)', color:'var(--accent)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
              <path d="M9 18l6-6-6-6" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center text-[10px] font-bold py-1" style={{ color:'var(--muted)' }}>{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells before first day */}
          {Array.from({ length: firstWeekday }).map((_, i) => (
            <div key={`e${i}`} className="cal-day cal-day-empty" />
          ))}
          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const key = toKey(viewYear, viewMonth, day)
            const dayData = calMap.get(key)
            const isToday = key === todayStr
            const isPast = key < todayStr

            let cls = 'cal-day cal-day-default'
            if (dayData?.status === 'planned') cls += ' cal-day-planned'
            else if (dayData?.status === 'worked') cls += ' cal-day-worked'
            if (isToday) cls += ' cal-day-today'

            return (
              <button key={day} type="button" onClick={() => handleDayClick(day)} className={cls}
                style={{ color: !dayData ? (isPast ? 'var(--muted)' : 'var(--text)') : undefined }}>
                {day}
                {dayData?.status === 'worked' && dayData.hours && (
                  <span className="absolute bottom-0.5 left-0 right-0 text-center"
                    style={{ fontSize:'7px', color:'var(--success)', lineHeight:1 }}>
                    {dayData.hours}ч
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 justify-center">
          {[
            { cls:'cal-day-planned', label:'Запланировано' },
            { cls:'cal-day-worked',  label:'Отработано' },
          ].map(({ cls, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`cal-day ${cls} w-5 h-5 pointer-events-none`} style={{ fontSize: 0 }} />
              <span className="text-[10px]" style={{ color:'var(--muted)' }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Tap hint */}
        <p className="text-[10px] text-center mt-2" style={{ color:'var(--muted)' }}>
          Нажми день: 1×&nbsp;→ план &nbsp;·&nbsp; 2×&nbsp;→ отработан &nbsp;·&nbsp; 3×&nbsp;→ убрать
        </p>
      </div>

      {/* ── Month summary ── */}
      <div className="glow-card rounded-3xl p-4">
        <div className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color:'var(--muted)' }}>
          {MONTHS[viewMonth]} — итог
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label:'Запланировано', value:`${monthStats.planned} дн.`, color:'var(--accent)' },
            { label:'Отработано',    value:`${monthStats.worked} дн.`,  color:'var(--success)' },
            { label:'Часов всего',   value:`${monthStats.hours} ч`,     color:'var(--text)' },
            { label:'Заработок',     value:formatPrice(monthStats.earnings), color:'var(--success)', big:true },
          ].map(({ label, value, color, big }) => (
            <div key={label} className="rounded-2xl p-3" style={{ background:'rgba(139,124,248,0.08)', border:'1px solid var(--border)' }}>
              <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color:'var(--muted)' }}>{label}</div>
              <div className={`font-black ${big ? 'text-lg' : 'text-base'}`} style={{ color }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { menu } from './MenuView'
import { formatPrice } from '../utils'
import { useOnlineStatus } from '../hooks/useOnlineStatus'

interface Message {
  role: 'user' | 'assistant'
  content: string
  loading?: boolean
}

// Ultra-compact: only name + price — no descriptions or allergens
// 275 items × ~25 chars / 4 = ~1,700 tokens, well within limits
const MENU_LINES = menu
  .map((item) => `${item.name} (${item.category}) ${item.price > 0 ? formatPrice(item.price) : ''}`)
  .join('\n')

const SYSTEM_PROMPT = `Ты — помощник официанта в Гастропаб Чехов, Ярославль.

МЕНЮ:\n${MENU_LINES}

СТИЛЬ: кратко, по-русски, без таблиц и ## заголовков. Используй • списки и **жирный**. Макс 6 пунктов.`

async function askAI(messages: Array<{ role: string; content: string }>): Promise<string> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages] }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`)
  return data.content ?? ''
}

const QUICK = ['🍷 Что к стейку?', '🥗 Без глютена', '🍺 На кране?', '🧑‍🍳 Топ-5 блюд', '🌿 Без лактозы', '🍸 Безалкогольное']

export function AIView() {
  const online = useOnlineStatus()
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: 'Привет! Знаю всё меню Чехова 🍽️\n\n• Состав и аллергены\n• Вино к блюдам\n• Рекомендации',
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function send(text: string) {
    if (!text.trim() || loading || !online) return
    const userMsg: Message = { role: 'user', content: text.trim() }
    setMessages((p) => [...p, userMsg, { role: 'assistant', content: '', loading: true }])
    setInput('')
    setLoading(true)
    try {
      // Keep last 6 messages to avoid exceeding token limits
      const history = [...messages, userMsg].slice(-6).map((m) => ({ role: m.role, content: m.content }))
      const answer = await askAI(history)
      setMessages((p) => [...p.slice(0, -1), { role: 'assistant', content: answer }])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка'
      setMessages((p) => [...p.slice(0, -1), { role: 'assistant', content: `⚠️ ${msg}` }])
    } finally {
      setLoading(false)
    }
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) }
  }

  function render(text: string) {
    return text.split('\n').map((line, i, arr) => (
      <span key={i}>
        {line.split(/(\*\*[^*]+\*\*)/).map((p, j) =>
          p.startsWith('**') && p.endsWith('**') ? <strong key={j}>{p.slice(2, -2)}</strong> : p
        )}
        {i < arr.length - 1 && <br />}
      </span>
    ))
  }

  return (
    <div className="flex flex-col gap-3" style={{ minHeight: 'calc(100dvh - 200px)' }}>
      {!online && (
        <div className="rounded-2xl px-4 py-3 text-sm" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
          📵 <strong>Офлайн</strong> — AI требует интернет
        </div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto pb-2">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 animate-fade-in ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="mt-1 h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-xs font-black"
                style={{ background: 'var(--accent)', color: '#000' }}>AI</div>
            )}
            <div className="max-w-[84%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
              style={msg.role === 'user'
                ? { background: 'var(--accent)', color: '#000', fontWeight: 600, borderRadius: '20px 20px 6px 20px' }
                : { background: 'var(--glass-card)', backdropFilter: 'blur(16px)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px 20px 20px 20px' }
              }>
              {msg.loading
                ? <div className="flex items-center gap-1.5 py-0.5">
                    {[0,1,2].map(n => <span key={n} className="typing-dot w-2 h-2 rounded-full" style={{ background: 'var(--muted)' }} />)}
                  </div>
                : <p className="whitespace-pre-wrap">{render(msg.content)}</p>
              }
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {messages.length <= 2 && online && (
        <div className="flex flex-wrap gap-2">
          {QUICK.map((p) => (
            <button key={p} type="button" onClick={() => send(p)}
              className="rounded-full px-3 py-1.5 text-xs font-medium transition active:opacity-70 glass-card">
              {p}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 rounded-2xl px-3 py-2 glass-card">
        <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKey}
          placeholder={online ? 'Спросите что угодно…' : 'Нет соединения…'}
          disabled={!online || loading} rows={1}
          className="flex-1 resize-none bg-transparent py-1 text-sm outline-none disabled:cursor-not-allowed"
          style={{ maxHeight: '96px', color: 'var(--text)' }} />
        <button type="button" onClick={() => send(input)}
          disabled={!input.trim() || loading || !online}
          className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition disabled:opacity-30"
          style={{ background: 'var(--accent)', color: '#000' }}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>

      <p className="text-center text-[10px]" style={{ color: 'var(--muted)' }}>Groq · llama-3.1-8b-instant</p>
    </div>
  )
}

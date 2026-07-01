import { useEffect, useRef, useState } from 'react'
import { menu } from './MenuView'
import { formatPrice } from '../utils'
import { useOnlineStatus } from '../hooks/useOnlineStatus'

interface Message {
  role: 'user' | 'assistant'
  content: string
  loading?: boolean
}

// Compact menu — just name + price + category, no long descriptions
// This keeps the system prompt well under the 12k token limit
const MENU_COMPACT = menu
  .map((item) => {
    const price = item.price > 0 ? formatPrice(item.price) : '—'
    const allergens = item.allergens ? ` [${item.allergens}]` : ''
    const desc = item.description ? ` (${item.description.slice(0, 40)})` : ''
    return `${item.name} · ${item.category} · ${price}${allergens}${desc}`
  })
  .join('\n')

const SYSTEM_PROMPT = `Ты — AI-ассистент Гастропаб Чехов, Ярославль. Помогаешь официантам.

МЕНЮ:
${MENU_COMPACT}

ПРАВИЛА ОТВЕТА:
- По-русски, кратко и по делу
- НЕ используй таблицы (без |) и заголовки ##
- Используй списки с •, жирный **текст** и эмодзи
- Максимум 5–7 позиций в списке
- Помогай с составом, аллергенами, подбором вина к блюдам`

async function askAI(messages: Array<{ role: string; content: string }>): Promise<string> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error ?? `HTTP ${res.status}`)
  }
  const data = await res.json()
  return data.content ?? ''
}

const QUICK_PROMPTS = [
  '🍷 Что к стейку?',
  '🥗 Без глютена',
  '🍺 Что на кране?',
  '🧑‍🍳 Топ-5 блюд',
  '🌿 Без лактозы',
  '🍸 Безалкогольные',
]

export function AIView() {
  const online = useOnlineStatus()
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Привет! Я знаю всё меню Чехова 🍽️\n\nМогу помочь с:\n• Составом и аллергенами\n• Вином к блюдам\n• Рекомендациями гостям',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text: string) {
    if (!text.trim() || loading || !online) return
    const userMsg: Message = { role: 'user', content: text.trim() }
    const loadingMsg: Message = { role: 'assistant', content: '', loading: true }
    setMessages((prev) => [...prev, userMsg, loadingMsg])
    setInput('')
    setLoading(true)
    try {
      const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }))
      const answer = await askAI(history)
      setMessages((prev) => [...prev.slice(0, -1), { role: 'assistant', content: answer }])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка'
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: `⚠️ ${msg}` },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  function renderContent(content: string) {
    return content.split('\n').map((line, i, arr) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/)
      return (
        <span key={i}>
          {parts.map((p, j) =>
            p.startsWith('**') && p.endsWith('**')
              ? <strong key={j}>{p.slice(2, -2)}</strong>
              : p
          )}
          {i < arr.length - 1 && <br />}
        </span>
      )
    })
  }

  return (
    <div className="flex h-full flex-col gap-3" style={{ minHeight: 'calc(100dvh - 180px)' }}>
      {!online && (
        <div className="rounded-2xl px-4 py-3 text-sm" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
          📵 <strong>Офлайн</strong> — AI требует интернет
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto pb-2">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2 animate-fade-in ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div
                className="mt-1 h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-xs font-black"
                style={{ background: 'var(--accent)', color: '#000' }}
              >
                AI
              </div>
            )}
            <div
              className="max-w-[84%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
              style={
                msg.role === 'user'
                  ? { background: 'var(--accent)', color: '#000', fontWeight: 600, borderRadius: '20px 20px 6px 20px' }
                  : { background: 'var(--surface)', color: 'var(--text)', borderRadius: '6px 20px 20px 20px' }
              }
            >
              {msg.loading ? (
                <div className="flex items-center gap-1.5 py-0.5">
                  <span className="typing-dot w-2 h-2 rounded-full" style={{ background: 'var(--muted)' }} />
                  <span className="typing-dot w-2 h-2 rounded-full" style={{ background: 'var(--muted)' }} />
                  <span className="typing-dot w-2 h-2 rounded-full" style={{ background: 'var(--muted)' }} />
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{renderContent(msg.content)}</p>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      {messages.length <= 2 && online && (
        <div className="flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => sendMessage(p)}
              className="rounded-full px-3 py-1.5 text-xs font-medium transition active:opacity-70"
              style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div
        className="flex items-end gap-2 rounded-2xl px-3 py-2"
        style={{ background: 'var(--surface)' }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={online ? 'Спросите что угодно…' : 'Нет соединения…'}
          disabled={!online || loading}
          rows={1}
          className="flex-1 resize-none bg-transparent py-1 text-sm outline-none disabled:cursor-not-allowed"
          style={{ maxHeight: '100px', color: 'var(--text)' }}
        />
        <button
          type="button"
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading || !online}
          className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition disabled:opacity-30"
          style={{ background: 'var(--accent)', color: '#000' }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>

      <p className="text-center text-[10px]" style={{ color: 'var(--muted)' }}>
        Groq · llama-3.3-70b-versatile
      </p>
    </div>
  )
}

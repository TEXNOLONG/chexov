import { useEffect, useRef, useState } from 'react'
import { menu } from './MenuView'
import { formatPrice } from '../utils'
import { useOnlineStatus } from '../hooks/useOnlineStatus'

interface Message {
  role: 'user' | 'assistant'
  content: string
  image?: string
  loading?: boolean
}

const SYSTEM_PROMPT = `Ты — AI-ассистент ресторана Гастропаб Чехов в Ярославле. Ты помогаешь официантам.
Ты знаешь полное меню ресторана:

${menu
  .map(
    (item) =>
      `${item.name} (${item.category}) — ${item.price > 0 ? formatPrice(item.price) : 'цена не указана'}${item.description ? ': ' + item.description.slice(0, 100) : ''}${item.allergens ? ` [Аллергены: ${item.allergens}]` : ''}`,
  )
  .join('\n')}

ПРАВИЛА:
- Отвечай кратко, по-русски, разговорным языком
- НЕ используй таблицы Markdown (без |)
- НЕ используй заголовки ## или ###
- Используй нумерованные списки или маркеры •
- Используй жирный **текст** и эмодзи
- Максимум 5-7 позиций в списке
- Помогай с составом блюд, аллергенами, подбором вина`

async function askAI(messages: Array<{ role: string; content: string }>): Promise<string> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
    }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
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
      content: 'Привет! Я знаю всё меню Чехова 🍽️\n\nМогу помочь с:\n• Составом и аллергенами\n• Вином к блюдам\n• Рекомендациями',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

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
    } catch {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: '⚠️ Ошибка соединения. Проверьте интернет.' },
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
    <div className="flex h-full flex-col gap-3">
      {!online && (
        <div className="rounded-2xl px-4 py-3 text-sm" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
          📵 <strong>Офлайн</strong> — AI требует интернет
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            {msg.role === 'assistant' && (
              <div
                className="shrink-0 mt-1 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
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
                  <span className="typing-dot w-2 h-2 rounded-full bg-[var(--muted)]" />
                  <span className="typing-dot w-2 h-2 rounded-full bg-[var(--muted)]" />
                  <span className="typing-dot w-2 h-2 rounded-full bg-[var(--muted)]" />
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

      {/* Input bar */}
      <div
        className="flex items-end gap-2 rounded-2xl px-3 py-2"
        style={{ background: 'var(--surface)' }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={online ? 'Спросите что угодно…' : 'Нет соединения…'}
          disabled={!online || loading}
          rows={1}
          className="flex-1 resize-none bg-transparent py-1 text-sm outline-none placeholder:text-[var(--muted)] disabled:cursor-not-allowed"
          style={{ maxHeight: '120px', color: 'var(--text)' }}
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
        Groq · llama-3.3-70b
      </p>
    </div>
  )
}

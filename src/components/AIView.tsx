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

const SYSTEM_PROMPT = `Ты — AI-ассистент ресторана Гастропаб Чехов в Ярославле. Ты помогаешь официантам и гостям.
Ты знаешь полное меню ресторана:

${menu
  .map(
    (item) =>
      `${item.name} (${item.category}) — ${item.price > 0 ? formatPrice(item.price) : 'цена не указана'}${item.description ? ': ' + item.description.slice(0, 120) : ''}${item.allergens ? ` [Аллергены: ${item.allergens}]` : ''}`,
  )
  .join('\n')}

Отвечай кратко и по делу на русском языке. Помогай с вопросами о составе блюд, аллергенах, вине к блюдам, рекомендациях.`

async function askAI(messages: Array<{ role: string; content: string }>): Promise<string> {
  const payload = {
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
    model: 'openai',
    seed: Math.floor(Math.random() * 10000),
  }

  const res = await fetch('https://text.pollinations.ai/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return await res.text()
}

const QUICK_PROMPTS = [
  '🍷 Что посоветуешь к стейку?',
  '🥗 Безглютеновые блюда',
  '🍺 Что на кране?',
  '🧑‍🍳 Топ-5 блюд ресторана',
  '🌿 Блюда без лактозы',
  '🍸 Безалкогольные коктейли',
]

export function AIView() {
  const online = useOnlineStatus()
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Привет! Я AI-ассистент Гастропаб Чехов 🍽️\n\nМогу помочь с:\n• Составом и аллергенами блюд\n• Рекомендациями вина к блюдам\n• Описанием позиций меню\n• Ответами на любые вопросы о ресторане',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [imagePrompt, setImagePrompt] = useState('')
  const [showImageGen, setShowImageGen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return
    if (!online) return

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
        {
          role: 'assistant',
          content: '⚠️ Ошибка соединения. Проверьте интернет и попробуйте снова.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  async function generateImage() {
    if (!imagePrompt.trim() || loading || !online) return
    const prompt = imagePrompt.trim()
    const userMsg: Message = { role: 'user', content: `🖼️ Сгенерируй картинку: ${prompt}` }
    const loadingMsg: Message = { role: 'assistant', content: '', loading: true }
    setMessages((prev) => [...prev, userMsg, loadingMsg])
    setImagePrompt('')
    setShowImageGen(false)
    setLoading(true)

    try {
      const encoded = encodeURIComponent(
        `${prompt}, restaurant food photography, professional, warm lighting`,
      )
      const url = `https://image.pollinations.ai/prompt/${encoded}?width=512&height=512&nologo=true&seed=${Date.now()}`
      await new Promise<void>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Image failed'))
        img.src = url
      })
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: `Вот изображение: **${prompt}**`, image: url },
      ])
    } catch {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: 'assistant',
          content: '⚠️ Не удалось сгенерировать изображение. Попробуйте снова.',
        },
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

  return (
    <div className="flex h-full flex-col">
      {/* Offline notice */}
      {!online && (
        <div className="mb-3 flex items-center gap-2 rounded-2xl border border-[#5a2828] bg-[#3a1e1e] px-4 py-3 text-sm text-[#ffb4b4] animate-fade-in">
          <span className="text-lg">📵</span>
          <div>
            <div className="font-semibold">Офлайн режим</div>
            <div className="text-xs opacity-80">AI-чат требует подключения к интернету. Меню и заказы доступны офлайн.</div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto pb-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            {msg.role === 'assistant' && (
              <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-sm">
                🤖
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === 'user'
                  ? 'rounded-tr-sm bg-[var(--accent)] text-[#0f0c09] font-medium'
                  : 'rounded-tl-sm bg-[var(--surface-2)] text-[var(--text)]'
              }`}
            >
              {msg.loading ? (
                <div className="flex items-center gap-1 py-1">
                  <span className="typing-dot h-2 w-2 rounded-full bg-[var(--muted)]" />
                  <span className="typing-dot h-2 w-2 rounded-full bg-[var(--muted)]" />
                  <span className="typing-dot h-2 w-2 rounded-full bg-[var(--muted)]" />
                </div>
              ) : (
                <>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  {msg.image && (
                    <img src={msg.image} alt="AI generated" className="mt-3 w-full rounded-xl" />
                  )}
                </>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      {messages.length <= 2 && online && (
        <div className="mb-3 flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => sendMessage(p)}
              className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Image generation panel */}
      {showImageGen && online && (
        <div className="mb-3 flex gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 animate-slide-up">
          <input
            value={imagePrompt}
            onChange={(e) => setImagePrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && generateImage()}
            placeholder="Опиши блюдо для генерации..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--muted)]"
            autoFocus
          />
          <button
            type="button"
            onClick={generateImage}
            disabled={!imagePrompt.trim() || loading}
            className="rounded-xl bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-[#0f0c09] disabled:opacity-40"
          >
            Создать
          </button>
          <button
            type="button"
            onClick={() => setShowImageGen(false)}
            className="text-[var(--muted)]"
          >
            ✕
          </button>
        </div>
      )}

      {/* Input */}
      <div
        className={`flex items-end gap-2 rounded-2xl border px-3 py-2 transition ${
          online ? 'border-[var(--border)] bg-[var(--surface)]' : 'border-[#5a2828] bg-[#2a1414] opacity-60'
        }`}
      >
        {online && (
          <button
            type="button"
            onClick={() => setShowImageGen((v) => !v)}
            title="Сгенерировать изображение"
            className="mb-1 shrink-0 text-lg text-[var(--muted)] transition hover:text-[var(--accent)]"
          >
            🖼️
          </button>
        )}
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={online ? 'Спросите что угодно...' : 'Нет соединения...'}
          disabled={!online || loading}
          rows={1}
          className="flex-1 resize-none bg-transparent py-1 text-sm outline-none placeholder:text-[var(--muted)] disabled:cursor-not-allowed"
          style={{ maxHeight: '120px' }}
        />
        <button
          type="button"
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading || !online}
          className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[#0f0c09] transition disabled:opacity-40"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
      <p className="mt-2 text-center text-[10px] text-[var(--muted)]">
        AI работает бесплатно через Pollinations.ai
      </p>
    </div>
  )
}

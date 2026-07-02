import { useEffect, useRef, useState } from 'react'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { loadProfile } from '../hooks/useProfile'

interface Message {
  role: 'user' | 'assistant'
  content: string
  loading?: boolean
}

const SYSTEM_PROMPT = `Ты — ИИ-помощник официанта в Гастропабе Чехов, Ярославль.
В меню: европейская и русская кухня — закуски, салаты, супы, горячее, стейки, морепродукты, десерты. Бар: пиво (кран/бутылка), вина (белые/красные/розовые/игристые), коктейли, крепкие напитки, безалкогольные.
Помогай с составом блюд, аллергенами (глютен/лактоза/орехи), подбором вина, рекомендациями гостям.
Отвечай кратко по-русски. Используй • списки и **жирный**. Без таблиц и ## заголовков. Макс 6 пунктов.`

async function askAI(messages: Array<{ role: string; content: string }>): Promise<string> {
  const profile = loadProfile()
  const apiKey = profile.groqApiKey

  // If user has set a Groq key in profile → call API directly (works in APK)
  if (apiKey) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
        max_tokens: 400,
        temperature: 0.7,
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error?.message ?? `HTTP ${res.status}`)
    return data.choices?.[0]?.message?.content ?? ''
  }

  // Fallback: use dev proxy (browser only, won't work in APK without key)
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages] }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`)
  return data.content ?? ''
}

const QUICK = ['🍷 Вино к стейку', '🥗 Без глютена', '🍺 Что на кране?', '🧑‍🍳 Топ-5 блюд', '🌿 Без лактозы', '🍸 Безалкогольные']

// Typed Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onend: (() => void) | null
  onerror: ((e: Event) => void) | null
}
declare const webkitSpeechRecognition: new () => SpeechRecognitionInstance
declare const SpeechRecognition: new () => SpeechRecognitionInstance

function getSpeechRecognition(): SpeechRecognitionInstance | null {
  try {
    if (typeof SpeechRecognition !== 'undefined') return new SpeechRecognition()
    if (typeof webkitSpeechRecognition !== 'undefined') return new webkitSpeechRecognition()
  } catch {}
  return null
}

export function AIView() {
  const online = useOnlineStatus()
  const profile = loadProfile()
  const hasKey = !!profile.groqApiKey

  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: 'Привет! Я помогу с меню Чехова 🍽️\n\n• Состав блюд и аллергены\n• Вино к едe\n• Рекомендации гостям',
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function send(text: string) {
    if (!text.trim() || loading || !online) return
    const userMsg: Message = { role: 'user', content: text.trim() }
    setMessages((p) => [...p, userMsg, { role: 'assistant', content: '', loading: true }])
    setInput('')
    setLoading(true)
    try {
      const history = [...messages, userMsg].slice(-4).map((m) => ({ role: m.role, content: m.content }))
      const answer = await askAI(history)
      setMessages((p) => [...p.slice(0, -1), { role: 'assistant', content: answer }])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка соединения'
      setMessages((p) => [...p.slice(0, -1), { role: 'assistant', content: `⚠️ ${msg}` }])
    } finally {
      setLoading(false)
    }
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) }
  }

  function toggleVoice() {
    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }

    const rec = getSpeechRecognition()
    if (!rec) {
      alert('Голосовой ввод не поддерживается вашим браузером')
      return
    }

    rec.lang = 'ru-RU'
    rec.continuous = false
    rec.interimResults = false

    rec.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = e.results[0]?.[0]?.transcript ?? ''
      setInput((prev) => (prev ? prev + ' ' + transcript : transcript))
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)

    recognitionRef.current = rec
    rec.start()
    setListening(true)
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

      {online && !hasKey && (
        <div className="rounded-2xl px-4 py-3 text-xs" style={{ background: 'rgba(139,124,248,0.09)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
          💡 Для работы AI в APK добавьте Groq API Key в <strong style={{ color: 'var(--accent)' }}>Профиль → ✏️</strong>
        </div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto pb-2">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 animate-fade-in ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="mt-1 h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-xs font-black"
                style={{ background: 'linear-gradient(135deg, var(--purple) 0%, var(--accent) 100%)', color: '#07050e' }}>
                AI
              </div>
            )}
            <div className="max-w-[84%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
              style={msg.role === 'user'
                ? { background: 'var(--accent)', color: '#07050e', fontWeight: 600, borderRadius: '20px 20px 6px 20px' }
                : { background: 'var(--surface-solid)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px 20px 20px 20px' }
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
              className="rounded-full px-3 py-1.5 text-xs font-medium transition active:opacity-70"
              style={{ background: 'var(--surface-solid)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>
              {p}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 rounded-2xl px-3 py-2"
        style={{ background: 'var(--surface-solid)', border: '1px solid var(--border)' }}>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKey}
          placeholder={online ? 'Спросите что угодно…' : 'Нет соединения…'}
          disabled={!online || loading} rows={1}
          className="flex-1 resize-none bg-transparent py-1 text-sm outline-none disabled:cursor-not-allowed"
          style={{ maxHeight: '96px', color: 'var(--text)' }} />

        {/* Voice button */}
        <button
          type="button"
          onClick={toggleVoice}
          disabled={!online || loading}
          title="Голосовой ввод"
          className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition disabled:opacity-30"
          style={{
            background: listening ? 'var(--danger-soft)' : 'rgba(139,124,248,0.14)',
            border: listening ? '1px solid rgba(248,113,113,0.4)' : '1px solid var(--border)',
            color: listening ? 'var(--danger)' : 'var(--muted)',
          }}
        >
          {listening ? (
            // Animated mic while recording
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 animate-pulse">
              <rect x="9" y="2" width="6" height="13" rx="3"/>
              <path d="M5 10a7 7 0 0014 0M12 19v3M9 22h6" stroke="currentColor" strokeWidth={2} fill="none" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <rect x="9" y="2" width="6" height="13" rx="3" fill="currentColor" stroke="none" style={{ opacity:.7 }}/>
              <path d="M5 10a7 7 0 0014 0M12 19v3M9 22h6" strokeLinecap="round"/>
            </svg>
          )}
        </button>

        {/* Send button */}
        <button type="button" onClick={() => send(input)}
          disabled={!input.trim() || loading || !online}
          className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition disabled:opacity-30"
          style={{ background: 'var(--accent)', color: '#07050e' }}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>

      <p className="text-center text-[10px]" style={{ color: 'var(--muted)' }}>
        Groq · llama-3.3-70b-versatile
        {hasKey && <span style={{ color: 'var(--success)' }}> · прямой режим ✓</span>}
      </p>
    </div>
  )
}

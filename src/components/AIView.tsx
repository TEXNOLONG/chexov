import { useMemo, useRef, useState } from 'react'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { loadProfile } from '../hooks/useProfile'
import { useGoStop } from '../contexts/GoStopContext'
import { menu } from './MenuView'

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

  if (apiKey) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
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

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string; continuous: boolean; interimResults: boolean
  start(): void; stop(): void
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

type Segment = { type: 'text' | 'bold' | 'go' | 'stop'; text: string }

interface HighlightData {
  goLower: Set<string>
  stopLower: Set<string>
  regex: RegExp | null
}

function buildHighlight(goSet: Set<string>, stopSet: Set<string>): HighlightData {
  const goNames: string[]   = []
  const stopNames: string[] = []
  for (const item of menu) {
    if (goSet.has(item.id))   goNames.push(item.name)
    if (stopSet.has(item.id)) stopNames.push(item.name)
  }
  // Sort longest first so longer matches win in regex alternation
  goNames.sort((a, b) => b.length - a.length)
  stopNames.sort((a, b) => b.length - a.length)

  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts: string[] = []
  if (goNames.length)   parts.push(`(${goNames.map(escape).join('|')})`)
  if (stopNames.length) parts.push(`(${stopNames.map(escape).join('|')})`)
  parts.push('(\\*\\*[^*]+\\*\\*)')

  return {
    goLower:   new Set(goNames.map((n) => n.toLowerCase())),
    stopLower: new Set(stopNames.map((n) => n.toLowerCase())),
    regex: parts.length > 1 ? new RegExp(parts.join('|'), 'gi') : null,
  }
}

function parseLine(line: string, h: HighlightData): Segment[] {
  if (!h.regex) {
    return line.split(/(\*\*[^*]+\*\*)/).map((p) =>
      p.startsWith('**') && p.endsWith('**')
        ? { type: 'bold' as const, text: p.slice(2, -2) }
        : { type: 'text' as const, text: p }
    )
  }
  h.regex.lastIndex = 0 // regex is shared across lines, reset before each use
  const segs: Segment[] = []
  let last = 0; let m: RegExpExecArray | null
  while ((m = h.regex.exec(line)) !== null) {
    if (m.index > last) segs.push({ type: 'text', text: line.slice(last, m.index) })
    const matched = m[0]
    if (matched.startsWith('**') && matched.endsWith('**')) segs.push({ type: 'bold', text: matched.slice(2, -2) })
    else if (h.goLower.has(matched.toLowerCase()))         segs.push({ type: 'go',   text: matched })
    else if (h.stopLower.has(matched.toLowerCase()))       segs.push({ type: 'stop', text: matched })
    else                                                   segs.push({ type: 'text', text: matched })
    last = m.index + matched.length
  }
  if (last < line.length) segs.push({ type: 'text', text: line.slice(last) })
  return segs
}

export function AIView() {
  const online = useOnlineStatus()
  const profile = loadProfile()
  const hasKey = !!profile.groqApiKey
  const { goSet, stopSet } = useGoStop()

  // Memoize parsed highlight data — rebuilt only when GO/Stop sets change
  const highlight = useMemo(() => buildHighlight(goSet, stopSet), [goSet, stopSet])

  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: 'Привет! Я помогу с меню Чехова 🍽️\n\n• Состав блюд и аллергены\n• Вино к еде\n• Рекомендации гостям\n\nПозиции GO-меню выделяются 🟡, стоп-лист 🔴',
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  function scrollBottom() { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }

  async function send(text: string) {
    if (!text.trim() || loading || !online) return
    const userMsg: Message = { role: 'user', content: text.trim() }
    setMessages((p) => [...p, userMsg, { role: 'assistant', content: '', loading: true }])
    setInput('')
    setLoading(true)
    setTimeout(scrollBottom, 60)
    try {
      const history = [...messages, userMsg].slice(-4).map((m) => ({ role: m.role, content: m.content }))
      const answer = await askAI(history)
      setMessages((p) => [...p.slice(0, -1), { role: 'assistant', content: answer }])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка соединения'
      setMessages((p) => [...p.slice(0, -1), { role: 'assistant', content: `⚠️ ${msg}` }])
    } finally {
      setLoading(false)
      setTimeout(scrollBottom, 60)
    }
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) }
  }

  function toggleVoice() {
    if (listening) { recognitionRef.current?.stop(); setListening(false); return }
    const rec = getSpeechRecognition()
    if (!rec) { alert('Голосовой ввод не поддерживается'); return }
    rec.lang = 'ru-RU'; rec.continuous = false; rec.interimResults = false
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const t = e.results[0]?.[0]?.transcript ?? ''
      setInput((prev) => prev ? prev + ' ' + t : t)
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    recognitionRef.current = rec
    rec.start()
    setListening(true)
  }

  function renderSeg(seg: Segment, i: number) {
    if (seg.type === 'bold') return <strong key={i}>{seg.text}</strong>
    if (seg.type === 'go')   return (
      <span key={i} className="font-semibold rounded px-0.5"
        style={{ background: 'rgba(245,197,24,0.2)', color: '#f5c518' }}>
        🟡 {seg.text}
      </span>
    )
    if (seg.type === 'stop') return (
      <span key={i} className="font-semibold rounded px-0.5 line-through"
        style={{ background: 'rgba(248,113,113,0.15)', color: 'var(--danger)' }}>
        🔴 {seg.text}
      </span>
    )
    return <span key={i}>{seg.text}</span>
  }

  function render(text: string) {
    return text.split('\n').map((line, i, arr) => (
      <span key={i}>
        {parseLine(line, highlight).map((seg, j) => renderSeg(seg, j))}
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

      {(goSet.size > 0 || stopSet.size > 0) && (
        <div className="rounded-2xl px-3 py-2 text-xs flex items-center gap-2 flex-wrap"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
          {goSet.size > 0 && <span>🟡 GO: <strong style={{ color: '#f5c518' }}>{goSet.size}</strong></span>}
          {stopSet.size > 0 && <span>🔴 Стоп: <strong style={{ color: 'var(--danger)' }}>{stopSet.size}</strong></span>}
          <span className="opacity-60">— подсвечиваются в ответах AI</span>
        </div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto pb-2">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 animate-fade-in ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="mt-1 h-7 w-7 shrink-0 rounded-full flex items-center justify-center"
                style={{ background: 'var(--surface-solid)', border: '1px solid var(--border)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }}>
                  <path d="M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 01-1 1H9a1 1 0 01-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z" strokeLinecap="round"/>
                  <path d="M10 17v3M14 17v3" strokeLinecap="round"/>
                </svg>
              </div>
            )}
            <div className="max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
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

        <button type="button" onClick={toggleVoice} disabled={!online || loading} title="Голосовой ввод"
          className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition disabled:opacity-30"
          style={{
            background: listening ? 'var(--danger-soft)' : 'rgba(139,124,248,0.14)',
            border: listening ? '1px solid rgba(248,113,113,0.4)' : '1px solid var(--border)',
            color: listening ? 'var(--danger)' : 'var(--muted)',
          }}>
          {listening
            ? <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 animate-pulse">
                <rect x="9" y="2" width="6" height="13" rx="3"/>
                <path d="M5 10a7 7 0 0014 0M12 19v3M9 22h6" stroke="currentColor" strokeWidth={2} fill="none" strokeLinecap="round"/>
              </svg>
            : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <rect x="9" y="2" width="6" height="13" rx="3" fill="currentColor" stroke="none" style={{ opacity:.7 }}/>
                <path d="M5 10a7 7 0 0014 0M12 19v3M9 22h6" strokeLinecap="round"/>
              </svg>
          }
        </button>

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

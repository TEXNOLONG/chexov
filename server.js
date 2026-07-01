import express from 'express'

const app = express()
app.use(express.json({ limit: '256kb' }))

const API_KEY = process.env.GROQ_API_KEY

// Lazy-load Groq only when key is available
let groq = null
if (API_KEY) {
  const { default: Groq } = await import('groq-sdk')
  groq = new Groq({ apiKey: API_KEY })
} else {
  console.warn('⚠️  GROQ_API_KEY not set — AI tab will be unavailable')
}

app.post('/api/chat', async (req, res) => {
  if (!groq) {
    return res.status(503).json({ error: 'AI недоступен: не задан GROQ_API_KEY' })
  }
  try {
    const { messages } = req.body
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages must be an array' })
    }
    const trimmed = messages.slice(-6)
    const completion = await groq.chat.completions.create({
      messages: trimmed,
      model: 'llama-3.3-70b-versatile',
      max_tokens: 400,
      temperature: 0.7,
    })
    res.json({ content: completion.choices[0].message.content ?? '' })
  } catch (err) {
    console.error('[Groq]', err?.message ?? err)
    const status = err?.status ?? 500
    res.status(status).json({ error: err?.message ?? 'AI unavailable' })
  }
})

app.listen(3001, () => console.log('🤖 Groq proxy :3001'))

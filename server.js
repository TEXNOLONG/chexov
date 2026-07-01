import express from 'express'
import Groq from 'groq-sdk'

const app = express()
app.use(express.json({ limit: '256kb' }))

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages must be an array' })
    }
    // Trim history to last 6 messages to stay within token budget
    const trimmed = messages.slice(-6)
    const completion = await groq.chat.completions.create({
      messages: trimmed,
      model: 'llama-3.1-8b-instant',   // 20k TPM on free tier vs 12k for 70b
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

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
    const completion = await groq.chat.completions.create({
      messages,
      model: 'llama-3.3-70b-versatile',
      max_tokens: 600,
      temperature: 0.7,
    })
    res.json({ content: completion.choices[0].message.content ?? '' })
  } catch (err) {
    console.error('[Groq]', err?.message)
    res.status(500).json({ error: 'AI unavailable' })
  }
})

app.listen(3001, () => console.log('🤖 Groq proxy on :3001'))

import { GoogleGenAI } from '@google/genai'
import config from '../config/index.js'

const PROMPT = `Analyze the following journal entry.

Extract:
- sentiment (one word describing emotional state, e.g. Positive, Negative, Neutral, Anxious, Happy, Angry, Sad, Motivated, Stressed, Calm, Excited)
- themes (3-5 key topics as short words or phrases)

Return JSON only, no markdown formatting.

Example output:
{"sentiment": "Positive", "themes": ["Study", "Focus", "Productivity"]}

Journal entry:`

async function analyzeJournalEntry(text) {
  const apiKey = config.gemini.apiKey
  const modelName = config.gemini.generationModel

  if (!apiKey || !modelName) {
    return null
  }

  const ai = new GoogleGenAI({ apiKey })
  const response = await ai.models.generateContent({
    model: modelName,
    contents: `${PROMPT}\n\n${text}`
  })
  const raw = response.text.trim()

  const jsonText = raw
    .replace(/^```json?\n?/i, '')
    .replace(/```\s*$/i, '')
    .trim()
  const parsed = JSON.parse(jsonText)

  return {
    sentiment: typeof parsed.sentiment === 'string' ? parsed.sentiment : null,
    themes: Array.isArray(parsed.themes) ? parsed.themes.slice(0, 5) : []
  }
}

export { analyzeJournalEntry }

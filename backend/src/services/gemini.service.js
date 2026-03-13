import { GoogleGenAI } from '@google/genai'
import config from '../config/index.js'

async function generateAccountabilityMessage(prompt) {
  const ai = new GoogleGenAI({ apiKey: config.gemini.apiKey })
  const response = await ai.models.generateContent({
    model: config.gemini.generationModel,
    contents: prompt
  })
  return response.text.trim()
}

export { generateAccountabilityMessage }

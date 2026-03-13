import { readFile } from 'fs/promises'
import { GoogleGenAI } from '@google/genai'
import config from '../config/index.js'

function getMimeType(filePath) {
  const ext = filePath.split('.').pop().toLowerCase()
  if (ext === 'png') return 'image/png'
  if (ext === 'webp') return 'image/webp'
  if (ext === 'gif') return 'image/gif'
  return 'image/jpeg'
}

async function describeImage(imagePath) {
  const imageBuffer = await readFile(imagePath)
  const base64Data = imageBuffer.toString('base64')
  const mimeType = getMimeType(imagePath)

  const ai = new GoogleGenAI({ apiKey: config.gemini.apiKey })
  const response = await ai.models.generateContent({
    model: config.gemini.generationModel,
    contents: [
      {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          {
            text: 'Describe what is visible in this image in one sentence. Focus on objects relevant to habits such as books, food, exercise equipment, study materials. Return only a short description.'
          }
        ]
      }
    ]
  })

  return response.text.trim()
}

async function verifyHabitProof(habitTitle, visionDescription) {
  const ai = new GoogleGenAI({ apiKey: config.gemini.apiKey })
  const prompt = `You are verifying proof of habit completion.

Habit: ${habitTitle}

Image description:
${visionDescription}

Determine if this image reasonably proves the habit.
Be strict and realistic.
If valid → approve.
If invalid → reject with a sarcastic comment.

Return JSON only, no markdown formatting:
{"approved": true, "reason": "short explanation", "confidence": 0.9}`

  const response = await ai.models.generateContent({
    model: config.gemini.generationModel,
    contents: prompt
  })

  const raw = response.text.trim()
  const jsonText = raw
    .replace(/^```json?\n?/i, '')
    .replace(/```\s*$/i, '')
    .trim()
  return JSON.parse(jsonText)
}

export { describeImage, verifyHabitProof }

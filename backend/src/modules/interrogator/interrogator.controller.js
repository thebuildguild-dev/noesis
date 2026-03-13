import { generateAccountabilityMessage } from '../../services/gemini.service.js'
import { success, error } from '../../utils/response.js'

async function generateQuestion(req, res, next) {
  try {
    const { entityType, entityName } = req.body
    if (!entityType || !entityName) {
      return error(res, 'entityType and entityName are required')
    }

    const prompt = `You are an AI system protecting user productivity and personal growth.

The user is attempting to delete:
${entityType}: "${entityName}"

Ask a short, sharp confrontational question challenging why they want to delete this. Be direct and slightly provocative — make them think twice. Keep it under 2 sentences. Do not offer alternatives. Just ask the question.`

    const question = await generateAccountabilityMessage(prompt)
    return success(res, { question })
  } catch (err) {
    next(err)
  }
}

async function evaluateJustification(req, res, next) {
  try {
    const { entityType, entityName, justification } = req.body
    if (!entityType || !entityName || !justification) {
      return error(res, 'entityType, entityName, and justification are required')
    }

    const prompt = `You are an AI system reviewing a user's justification for deleting something important.

They want to delete:
${entityType}: "${entityName}"

Their justification: "${justification}"

Evaluate if this explanation is SPECIFIC and GENUINE or VAGUE and WEAK.

Reply with a JSON object:
{
  "approved": true or false,
  "feedback": "one short sentence of feedback (10 words max)"
}

Only approve if they gave a real, specific reason. Reject vague responses like "I don't need it", "just because", "it's old", etc.`

    const raw = await generateAccountabilityMessage(prompt)
    let parsed
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw)
    } catch {
      parsed = { approved: true, feedback: '' }
    }

    return success(res, { approved: parsed.approved, feedback: parsed.feedback })
  } catch (err) {
    next(err)
  }
}

export { generateQuestion, evaluateJustification }

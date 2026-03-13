import { authFetch } from './client.js'

export async function fetchInterrogationQuestion(entityType, entityName) {
  const data = await authFetch('/api/interrogator/question', {
    method: 'POST',
    body: JSON.stringify({ entityType, entityName })
  })
  return data.data?.question ?? ''
}

export async function evaluateInterrogationJustification(entityType, entityName, justification) {
  const data = await authFetch('/api/interrogator/evaluate', {
    method: 'POST',
    body: JSON.stringify({ entityType, entityName, justification })
  })
  return { approved: data.data?.approved ?? true, feedback: data.data?.feedback ?? '' }
}

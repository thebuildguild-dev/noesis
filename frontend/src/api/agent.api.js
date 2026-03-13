import { authFetch } from './client.js'

export async function fetchAgentMessages() {
  const data = await authFetch('/api/agent/messages')
  return data.data?.messages ?? []
}

import { env } from '../config/env'

export async function callEdge<T>(
  functionName: string,
  token: string,
  body: Record<string, unknown> = {},
): Promise<T> {
  const res = await fetch(`${env.SUPABASE_URL}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}))
    throw new Error((payload as any).error ?? res.statusText)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export async function callEdgeText(
  functionName: string,
  token: string,
  body: Record<string, unknown> = {},
): Promise<string> {
  const res = await fetch(`${env.SUPABASE_URL}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}))
    throw new Error((payload as any).error ?? res.statusText)
  }

  return res.text()
}

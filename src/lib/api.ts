/**
 * Lightweight API client for the Chatter Box backend.
 * JWT token is stored in localStorage for simplicity.
 * NOTE (security): For a production app, consider using httpOnly cookies
 * or an in-memory token + silent refresh strategy to reduce XSS risk.
 */

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ""

const TOKEN_KEY = "chatterbox_token"

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  if (!res.ok) {
    let message = `Request failed: ${res.status}`
    try {
      const body = (await res.json()) as { error?: string }
      if (body.error) message = body.error
    } catch {
      // ignore parse error
    }
    throw new Error(message)
  }
  return res.json() as Promise<T>
}

export interface ApiUser {
  id: string
  email: string
  username: string
  displayName?: string
  preferredName?: string
  chatbotName?: string
  personalityPreset?: string
  avatarUrl?: string
  createdAt: string
  updatedAt?: string
}

export interface AuthResponse {
  token: string
  user: ApiUser
}

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export const api = {
  chat: {
    send(messages: ChatMessage[], systemPrompt?: string) {
      return request<{ content: string }>("/chat", {
        method: "POST",
        body: JSON.stringify({ messages, systemPrompt }),
      })
    },
  },
  auth: {
    register(data: { email: string; password: string; username?: string }) {
      return request<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      })
    },
    login(data: { email: string; password: string }) {
      return request<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      })
    },
  },
  user: {
    me() {
      return request<ApiUser>("/me")
    },
    updateMe(data: Partial<Omit<ApiUser, "id" | "email" | "createdAt" | "updatedAt">>) {
      return request<ApiUser>("/me", { method: "PUT", body: JSON.stringify(data) })
    },
    getSettings() {
      return request<Record<string, unknown>>("/settings")
    },
    putSettings(data: Record<string, unknown>) {
      return request<Record<string, unknown>>("/settings", {
        method: "PUT",
        body: JSON.stringify(data),
      })
    },
  },
}

/// <reference types="vite/client" />
// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare const GITHUB_RUNTIME_PERMANENT_NAME: string
// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare const BASE_KV_SERVICE_URL: string

interface UserInfo {
  avatarUrl: string
  email: string
  id: string
  isOwner: boolean
  login: string
}

declare global {
  interface Window {
    spark: {
      llmPrompt: (strings: TemplateStringsArray, ...values: unknown[]) => string
      llm: (prompt: string, modelName?: string, jsonMode?: boolean) => Promise<string>
      user: () => Promise<UserInfo>
      kv: {
        keys: () => Promise<string[]>
        get: <T>(key: string) => Promise<T | undefined>
        set: <T>(key: string, value: T) => Promise<void>
        delete: (key: string) => Promise<void>
      }
    }
  }
}

export {}
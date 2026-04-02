import { useState, useEffect, useCallback } from "react"

type Setter<T> = T | ((prev: T) => T)

/**
 * Drop-in replacement for @github/spark/hooks `useKV`.
 * Persists values in localStorage, scoped by `key`.
 */
export function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: Setter<T>) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored !== null ? (JSON.parse(stored) as T) : defaultValue
    } catch {
      return defaultValue
    }
  })

  // Keep in sync if another tab updates the same key
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === key) {
        try {
          setState(e.newValue !== null ? (JSON.parse(e.newValue) as T) : defaultValue)
        } catch {
          // ignore
        }
      }
    }
    window.addEventListener("storage", handler)
    return () => window.removeEventListener("storage", handler)
  }, [key, defaultValue])

  const set = useCallback(
    (value: Setter<T>) => {
      setState((prev) => {
        const next = typeof value === "function" ? (value as (prev: T) => T)(prev) : value
        try {
          localStorage.setItem(key, JSON.stringify(next))
        } catch {
          // ignore quota errors silently
        }
        return next
      })
    },
    [key]
  )

  return [state, set]
}

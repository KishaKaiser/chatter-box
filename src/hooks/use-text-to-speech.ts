import { useState, useEffect, useRef, useCallback } from "react"

export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const currentTextRef = useRef<string>("")

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setIsSupported(true)

      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices()
        setVoices(availableVoices)
      }

      loadVoices()
      window.speechSynthesis.onvoiceschanged = loadVoices

      return () => {
        window.speechSynthesis.cancel()
      }
    } else {
      setIsSupported(false)
    }
  }, [])

  const speak = useCallback(
    (text: string) => {
      if (!isSupported || !text.trim()) return

      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utteranceRef.current = utterance
      currentTextRef.current = text

      const englishVoice = voices.find(
        (voice) =>
          voice.lang.startsWith("en") &&
          (voice.name.includes("Google") ||
            voice.name.includes("Microsoft") ||
            voice.localService)
      )
      if (englishVoice) {
        utterance.voice = englishVoice
      }

      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 1.0

      utterance.onstart = () => {
        setIsSpeaking(true)
      }

      utterance.onend = () => {
        setIsSpeaking(false)
        currentTextRef.current = ""
      }

      utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event)
        setIsSpeaking(false)
        currentTextRef.current = ""
      }

      window.speechSynthesis.speak(utterance)
    },
    [isSupported, voices]
  )

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      currentTextRef.current = ""
    }
  }, [isSupported])

  const toggle = useCallback(
    (text: string) => {
      if (isSpeaking && currentTextRef.current === text) {
        stop()
      } else {
        speak(text)
      }
    },
    [isSpeaking, speak, stop]
  )

  return {
    isSpeaking,
    isSupported,
    speak,
    stop,
    toggle,
    currentText: currentTextRef.current,
  }
}

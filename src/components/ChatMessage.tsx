import { Robot, User, SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { useTextToSpeech } from "@/hooks/use-text-to-speech"

export type Message = {
  id: string
  role: "user" | "bot"
  content: string
  timestamp: number
}

type ChatMessageProps = {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isBot = message.role === "bot"
  const { isSpeaking, isSupported, toggle, currentText } = useTextToSpeech()
  const isThisMessageSpeaking = isSpeaking && currentText === message.content
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`flex gap-3 ${isBot ? "" : "flex-row-reverse"}`}
    >
      <Avatar className={`h-8 w-8 ${isBot ? "bg-primary" : "bg-accent"}`}>
        <AvatarFallback className={isBot ? "text-primary-foreground" : "text-accent-foreground"}>
          {isBot ? <Robot size={18} weight="bold" /> : <User size={18} weight="bold" />}
        </AvatarFallback>
      </Avatar>
      
      <div className={`flex flex-col gap-1 max-w-[75%] ${isBot ? "" : "items-end"}`}>
        <div
          className={`px-4 py-3 rounded-2xl ${
            isBot
              ? "bg-card text-card-foreground rounded-tl-sm"
              : "bg-accent text-accent-foreground rounded-tr-sm"
          }`}
        >
          <div className="flex items-start gap-2">
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words flex-1">
              {message.content}
            </p>
            {isBot && isSupported && (
              <Button
                onClick={() => toggle(message.content)}
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 hover:bg-primary/10 active:scale-95 transition-transform"
                title={isThisMessageSpeaking ? "Stop speaking" : "Read aloud"}
              >
                {isThisMessageSpeaking ? (
                  <SpeakerSlash size={16} weight="fill" className="text-accent animate-pulse" />
                ) : (
                  <SpeakerHigh size={16} weight="fill" className="text-muted-foreground" />
                )}
              </Button>
            )}
          </div>
        </div>
        <span className="text-[13px] text-muted-foreground px-2">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  )
}

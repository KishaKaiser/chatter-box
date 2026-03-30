import { Robot, User, SpeakerHigh, SpeakerSlash, FileImage, FilePdf, FileText, File as FileIcon } from "@phosphor-icons/react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { useTextToSpeech } from "@/hooks/use-text-to-speech"

export type MessageAttachment = {
  id: string
  name: string
  type: string
  url?: string
  size?: number
}

export type Message = {
  id: string
  role: "user" | "bot"
  content: string
  timestamp: number
  attachments?: MessageAttachment[]
}

type ChatMessageProps = {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isBot = message.role === "bot"
  const { isSpeaking, isSupported, toggle, currentText } = useTextToSpeech()
  const isThisMessageSpeaking = isSpeaking && currentText === message.content

  const getFileIcon = (type: string, name: string) => {
    if (type.includes("image")) return <FileImage size={16} weight="fill" />
    if (type.includes("pdf")) return <FilePdf size={16} weight="fill" />
    if (type.includes("text") || type.includes("markdown") || name.match(/\.(js|jsx|ts|tsx|py|java|cpp|c|h|css|html|json|xml|yaml|yml|go|rs|rb|php|swift|kt|sh)$/i)) return <FileText size={16} weight="fill" />
    if (type.includes("zip") || name.endsWith(".zip")) return <FileIcon size={16} weight="fill" />
    return <FileIcon size={16} weight="fill" />
  }

  const getFileTypeLabel = (type: string, name: string): string => {
    if (type.includes("image")) return "IMAGE"
    if (type.includes("pdf")) return "PDF"
    if (type.includes("text")) return "TXT"
    if (type.includes("markdown")) return "MD"
    if (type.includes("zip") || name.endsWith(".zip")) return "ZIP"
    const extension = name.split(".").pop()?.toUpperCase()
    if (extension && ["JS", "JSX", "TS", "TSX", "PY", "JAVA", "CPP", "C", "H", "CSS", "HTML", "JSON", "XML", "YAML", "YML", "GO", "RS", "RB", "PHP", "SWIFT", "KT", "SH", "CS", "R", "SQL", "VUE"].includes(extension)) {
      return extension
    }
    return "FILE"
  }
  
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
      
      <div className={`flex flex-col gap-2 max-w-[75%] ${isBot ? "" : "items-end"}`}>
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
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className={`flex items-center gap-2 p-2 rounded-lg ${
                    isBot ? "bg-background/50" : "bg-background/20"
                  }`}
                >
                  <div className={isBot ? "text-primary" : "text-accent-foreground/70"}>
                    {getFileIcon(attachment.type, attachment.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{attachment.name}</p>
                    {attachment.size && (
                      <p className="text-[11px] opacity-70">
                        {(attachment.size / 1024).toFixed(1)} KB
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary" className="text-[10px] h-5">
                    {getFileTypeLabel(attachment.type, attachment.name)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
        <span className="text-[13px] text-muted-foreground px-2">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  )
}

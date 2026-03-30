import { Robot, User, SpeakerHigh, SpeakerSlash, FileImage, FilePdf, FileText, File as FileIcon, ArrowClockwise, Copy } from "@phosphor-icons/react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { useTextToSpeech, VoiceSettings } from "@/hooks/use-text-to-speech"
import { CodeBlock } from "@/components/CodeBlock"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { DotsThree } from "@phosphor-icons/react"
import { useKV } from "@github/spark/hooks"

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
  onRegenerate?: (messageId: string) => void
  onImageClick?: (imageUrl: string) => void
  userKey?: string
}

type ContentPart = {
  type: "text" | "code"
  content: string
  language?: string
}

export function ChatMessage({ message, onRegenerate, onImageClick, userKey = "guest" }: ChatMessageProps) {
  const isBot = message.role === "bot"
  const [voiceSettings] = useKV<VoiceSettings>(`voice-settings-${userKey}`, {
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
  })
  const settings = voiceSettings || { rate: 1.0, pitch: 1.0, volume: 1.0 }
  const { isSpeaking, isSupported, toggle, currentText } = useTextToSpeech(settings)
  const isThisMessageSpeaking = isSpeaking && currentText === message.content

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      toast.success("Response copied to clipboard")
    } catch (error) {
      toast.error("Failed to copy response")
    }
  }

  const handleRegenerate = () => {
    if (onRegenerate) {
      onRegenerate(message.id)
      toast.info("Regenerating response...")
    }
  }

  const parseMessageContent = (content: string): ContentPart[] => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
    const parts: ContentPart[] = []
    let lastIndex = 0
    let match

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          content: content.slice(lastIndex, match.index)
        })
      }
      
      parts.push({
        type: "code",
        content: match[2].trim(),
        language: match[1] || undefined
      })
      
      lastIndex = match.index + match[0].length
    }

    if (lastIndex < content.length) {
      parts.push({
        type: "text",
        content: content.slice(lastIndex)
      })
    }

    return parts.length > 0 ? parts : [{ type: "text", content }]
  }

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

  const contentParts = parseMessageContent(message.content)
  
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
          className={`rounded-2xl ${
            isBot
              ? "text-card-foreground rounded-tl-sm"
              : "text-accent-foreground rounded-tr-sm"
          }`}
        >
          <div className="flex items-start gap-2 px-4 py-3">
            <div className="flex-1 overflow-hidden">
              {contentParts.map((part, index) => {
                if (part.type === "code") {
                  return (
                    <CodeBlock
                      key={index}
                      code={part.content}
                      language={part.language}
                    />
                  )
                }
                return (
                  <p key={index} className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                    {part.content}
                  </p>
                )
              })}
            </div>
            {isBot && (
              <div className="flex items-center gap-1 shrink-0">
                {isSupported && (
                  <Button
                    onClick={() => toggle(message.content)}
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hover:bg-primary/10 active:scale-95 transition-transform"
                    title={isThisMessageSpeaking ? "Stop speaking" : "Read aloud"}
                  >
                    {isThisMessageSpeaking ? (
                      <SpeakerSlash size={16} weight="fill" className="text-accent animate-pulse" />
                    ) : (
                      <SpeakerHigh size={16} weight="fill" className="text-muted-foreground" />
                    )}
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:bg-primary/10 active:scale-95 transition-transform"
                      title="More actions"
                    >
                      <DotsThree size={18} weight="bold" className="text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={handleCopy} className="cursor-pointer gap-2">
                      <Copy size={16} weight="bold" />
                      <span>Copy</span>
                    </DropdownMenuItem>
                    {onRegenerate && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleRegenerate} className="cursor-pointer gap-2">
                          <ArrowClockwise size={16} weight="bold" />
                          <span>Regenerate</span>
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((attachment) => (
                <div key={attachment.id}>
                  {attachment.url && attachment.type.includes("image") ? (
                    <div 
                      className="rounded-lg overflow-hidden border border-border cursor-pointer hover:border-accent transition-colors group"
                      onClick={() => onImageClick?.(attachment.url!)}
                      title="Click to edit image"
                    >
                      <img 
                        src={attachment.url} 
                        alt={attachment.name}
                        className="max-w-full h-auto max-h-[400px] object-contain group-hover:opacity-90 transition-opacity"
                      />
                      <div className={`flex items-center gap-2 p-2 ${
                        isBot ? "bg-background/50" : "bg-background/20"
                      }`}>
                        <div className={isBot ? "text-primary" : "text-accent-foreground/70"}>
                          <FileImage size={14} weight="fill" />
                        </div>
                        <p className="text-xs font-medium flex-1 truncate">{attachment.name}</p>
                        <Badge variant="secondary" className="text-[10px] h-5">
                          IMAGE
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div
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
                  )}
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

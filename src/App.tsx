import { useState, useRef, useEffect, KeyboardEvent } from "react"
import { useKV } from "@github/spark/hooks"
import { PaperPlaneRight, Sparkle, Microphone, MicrophoneSlash, DownloadSimple } from "@phosphor-icons/react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatMessage, Message } from "@/components/ChatMessage"
import { TypingIndicator } from "@/components/TypingIndicator"
import { KnowledgeBase, KnowledgeFile } from "@/components/KnowledgeBase"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { useIsMobile } from "@/hooks/use-mobile"
import { useVoiceInput } from "@/hooks/use-voice-input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function App() {
  const isMobile = useIsMobile()
  const [messages, setMessages] = useKV<Message[]>("chat-messages", [])
  const [knowledgeFiles, setKnowledgeFiles] = useKV<KnowledgeFile[]>("knowledge-files", [])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceInput()

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  useEffect(() => {
    if (transcript) {
      setInputValue(transcript + (interimTranscript ? " " + interimTranscript : ""))
    }
  }, [transcript, interimTranscript])

  const toggleVoiceInput = () => {
    if (!isSupported) {
      toast.error("Voice input is not supported in your browser")
      return
    }

    if (isListening) {
      stopListening()
      if (transcript.trim()) {
        handleSendMessage()
      }
    } else {
      resetTranscript()
      setInputValue("")
      startListening()
      toast.success("Listening... Speak now!")
    }
  }

  const generateBotResponse = async (userMessage: string): Promise<string> => {
    const files = knowledgeFiles || []
    const knowledgeContext = files
      .map((file) => {
        if (file.type.startsWith("image/")) {
          return `File: ${file.name} (Image - visual content available)`
        }
        return `File: ${file.name}\nContent: ${file.content.slice(0, 500)}...`
      })
      .join("\n\n")

    const contextPart = knowledgeContext || "No documents uploaded yet."
    const promptText = `You are Chatter Box, a helpful AI assistant. You have access to the following knowledge base:

${contextPart}

User question: ${userMessage}

Provide a helpful, conversational response. If the question relates to the uploaded documents, reference them specifically. If you don't have relevant information in your knowledge base, be honest about it and still try to help with general knowledge.`

    try {
      const response = await window.spark.llm(promptText, "gpt-4o-mini")
      return response
    } catch (error) {
      console.error("Error generating response:", error)
      return "I'm having trouble generating a response right now. Please try again in a moment."
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return

    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: "user",
      content: inputValue.trim(),
      timestamp: Date.now(),
    }

    setMessages((current) => [...(current || []), userMessage])
    setInputValue("")
    setIsTyping(true)

    const botResponse = await generateBotResponse(userMessage.content)

    const botMessage: Message = {
      id: `${Date.now()}-bot`,
      role: "bot",
      content: botResponse,
      timestamp: Date.now(),
    }

    setMessages((current) => [...(current || []), botMessage])
    setIsTyping(false)
    inputRef.current?.focus()
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleAddFile = (file: KnowledgeFile) => {
    setKnowledgeFiles((current) => [...(current || []), file])
  }

  const handleRemoveFile = (id: string) => {
    setKnowledgeFiles((current) => (current || []).filter((f) => f.id !== id))
  }

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })
  }

  const exportAsText = () => {
    if (!currentMessages.length) {
      toast.error("No conversation to export")
      return
    }

    let content = "Chatter Box - Conversation Export\n"
    content += "=" + "=".repeat(50) + "\n\n"
    
    currentMessages.forEach((msg) => {
      const role = msg.role === "user" ? "You" : "Chatter Box"
      const timestamp = formatTimestamp(msg.timestamp)
      content += `[${timestamp}] ${role}:\n${msg.content}\n\n`
    })

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chatter-box-export-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success("Conversation exported successfully")
  }

  const exportAsJSON = () => {
    if (!currentMessages.length) {
      toast.error("No conversation to export")
      return
    }

    const exportData = {
      exportDate: new Date().toISOString(),
      messageCount: currentMessages.length,
      messages: currentMessages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        formattedTimestamp: formatTimestamp(msg.timestamp)
      }))
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chatter-box-export-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success("Conversation exported successfully")
  }

  const currentMessages = messages || []
  const currentFiles = knowledgeFiles || []

  const KnowledgeBaseComponent = (
    <KnowledgeBase
      files={currentFiles}
      onAddFile={handleAddFile}
      onRemoveFile={handleRemoveFile}
    />
  )

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <Toaster position="top-center" />
      
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary to-accent rounded-xl p-2">
                <Sparkle size={28} weight="fill" className="text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight" style={{ letterSpacing: '-0.02em' }}>
                  Chatter Box
                </h1>
                <p className="text-muted-foreground text-sm md:text-base">
                  Your AI assistant that learns from your documents
                </p>
              </div>
            </div>
            {currentMessages.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-accent/50 text-accent hover:bg-accent/10 active:scale-95 transition-transform gap-2"
                  >
                    <DownloadSimple size={18} weight="bold" />
                    <span className="hidden sm:inline">Export</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={exportAsText} className="cursor-pointer">
                    Export as Text
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportAsJSON} className="cursor-pointer">
                    Export as JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="flex flex-col h-[calc(100vh-200px)] border-2">
              <ScrollArea className="flex-1 p-6" ref={scrollRef}>
                <div className="space-y-4">
                  {currentMessages.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                        <Sparkle size={32} className="text-primary" weight="fill" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Welcome to Chatter Box!</h3>
                      <p className="text-muted-foreground text-sm max-w-md mx-auto">
                        {currentFiles.length === 0
                          ? "Start by uploading some documents to teach me, then ask me anything!"
                          : "I've learned from your documents. Ask me anything!"}
                      </p>
                    </div>
                  )}
                  
                  {currentMessages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}
                  
                  {isTyping && <TypingIndicator />}
                </div>
              </ScrollArea>

              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder={isListening ? "Listening..." : "Type your message..."}
                    className="flex-1 focus-visible:ring-accent text-[15px]"
                    disabled={isTyping}
                  />
                  <Button
                    onClick={toggleVoiceInput}
                    disabled={isTyping}
                    variant={isListening ? "default" : "outline"}
                    className={isListening 
                      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-95 transition-transform animate-pulse" 
                      : "border-accent/50 text-accent hover:bg-accent/10 active:scale-95 transition-transform"}
                    size="icon"
                    title={isListening ? "Stop recording" : "Start voice input"}
                  >
                    {isListening ? (
                      <MicrophoneSlash size={20} weight="fill" />
                    ) : (
                      <Microphone size={20} weight="fill" />
                    )}
                  </Button>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isTyping}
                    className="bg-accent text-accent-foreground hover:bg-accent/90 active:scale-95 transition-transform"
                    size="icon"
                  >
                    <PaperPlaneRight size={20} weight="fill" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {isMobile ? (
            <div className="fixed bottom-4 right-4 z-50">
              <Sheet>
                <SheetTrigger asChild>
                  <Button size="lg" className="rounded-full shadow-lg">
                    Knowledge Base ({currentFiles.length})
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[80vh]">
                  <div className="py-4">{KnowledgeBaseComponent}</div>
                </SheetContent>
              </Sheet>
            </div>
          ) : (
            <div className="lg:col-span-1">{KnowledgeBaseComponent}</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
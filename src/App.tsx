import { useState, useRef, useEffect, KeyboardEvent } from "react"
import { useKV } from "@github/spark/hooks"
import { PaperPlaneRight, Sparkle } from "@phosphor-icons/react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatMessage, Message } from "@/components/ChatMessage"
import { TypingIndicator } from "@/components/TypingIndicator"
import { KnowledgeBase, KnowledgeFile } from "@/components/KnowledgeBase"
import { Toaster } from "@/components/ui/sonner"
import { useIsMobile } from "@/hooks/use-mobile"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

function App() {
  const isMobile = useIsMobile()
  const [messages, setMessages] = useKV<Message[]>("chat-messages", [])
  const [knowledgeFiles, setKnowledgeFiles] = useKV<KnowledgeFile[]>("knowledge-files", [])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

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
        <header className="mb-6 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
            <div className="bg-gradient-to-br from-primary to-accent rounded-xl p-2">
              <Sparkle size={28} weight="fill" className="text-primary-foreground" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight" style={{ letterSpacing: '-0.02em' }}>
              Chatter Box
            </h1>
          </div>
          <p className="text-muted-foreground text-sm md:text-base">
            Your AI assistant that learns from your documents
          </p>
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
                    placeholder="Type your message..."
                    className="flex-1 focus-visible:ring-accent text-[15px]"
                    disabled={isTyping}
                  />
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
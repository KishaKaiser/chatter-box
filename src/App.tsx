import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatMessage, Message, MessageAttachment } from "@/components/ChatMessage"
import { KnowledgeBase, KnowledgeFile } from "@/components/KnowledgeBase"
import { UserAccount, UserAccount as UserAccountType } from "@/components/UserAccount"
import { ConversationThreads } from "@/components/ConversationThreads"
import { ImageEditor } from "@/components/ImageEditor"
import { StoryCreator } from "@/components/StoryCreator"
import { ProfileSettings } from "@/components/ProfileSettings"
import { PaperPlaneRight, Chat, Image, BookOpen, Microphone, MicrophoneSlash, Robot } from "@phosphor-icons/react"
import { toast, Toaster } from "sonner"
import { useKV } from "@github/spark/hooks"
import { useVoiceInput } from "@/hooks/use-voice-input"
import { motion, AnimatePresence } from "framer-motion"
import { TypingIndicator } from "@/components/TypingIndicator"
import { WebSearch, SearchResult } from "@/components/WebSearch"
import { getPersonalityPrompt } from "@/lib/personality-presets"
import mouthIcon from "@/assets/images/mouth.jpg"

type Thread = {
  id: string
  title: string
  messageIds: string[]
  createdAt: number
  lastUpdatedAt: number
  archived: boolean
}

function App() {
  const [currentUser, setCurrentUser] = useKV<UserAccountType | null>("current-user", null)
  const userKey = currentUser?.id || "guest"

  const [allMessages, setAllMessages] = useKV<Record<string, Message>>(`all-messages-${userKey}`, {})
  const [threads, setThreads] = useKV<Thread[]>(`threads-${userKey}`, [
    {
      id: "default",
      title: "General Chat",
      messageIds: [],
      createdAt: Date.now(),
      lastUpdatedAt: Date.now(),
      archived: false,
    },
  ])
  const [currentThreadId, setCurrentThreadId] = useKV<string>(`current-thread-${userKey}`, "default")
  const [knowledgeFiles, setKnowledgeFiles] = useKV<KnowledgeFile[]>(`knowledge-files-${userKey}`, [])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [imageEditorOpen, setImageEditorOpen] = useState(false)
  const [imageEditorMode, setImageEditorMode] = useState<"edit" | "create" | "enhance">("edit")
  const [imageEditorUrl, setImageEditorUrl] = useState<string | undefined>(undefined)
  const [storyCreatorOpen, setStoryCreatorOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [webSearchEnabled, setWebSearchEnabled] = useKV<boolean>(`web-search-enabled-${userKey}`, false)
  const [rememberWebSearch, setRememberWebSearch] = useKV<boolean>(`remember-web-search-${userKey}`, false)
  const [webSearchResults, setWebSearchResults] = useState<SearchResult[] | null>(null)
  const [webSearchQuery, setWebSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  const currentThread = threads?.find((t) => t.id === currentThreadId) || threads?.[0]
  const messages = currentThread
    ? currentThread.messageIds
        .map((id) => allMessages?.[id])
        .filter((m): m is Message => m !== undefined)
        .sort((a, b) => a.timestamp - b.timestamp)
    : []

  const { isListening, transcript, startListening, stopListening, isSupported } = useVoiceInput()

  useEffect(() => {
    if (transcript && !isListening) {
      setInputValue(transcript)
    }
  }, [transcript, isListening])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  const handleLogin = (user: UserAccountType) => {
    setCurrentUser(user)
    toast.success(`Welcome back, ${user.displayName || user.username}!`)
  }

  const handleLogout = () => {
    setCurrentUser(null)
    toast.success("Logged out successfully")
  }

  const addMessage = (message: Omit<Message, "id" | "timestamp">) => {
    const newMessage: Message = {
      ...message,
      id: `msg-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    }

    setAllMessages((prev) => ({
      ...(prev || {}),
      [newMessage.id]: newMessage,
    }))

    setThreads((prevThreads) =>
      (prevThreads || []).map((t) =>
        t.id === currentThreadId
          ? {
              ...t,
              messageIds: [...t.messageIds, newMessage.id],
              lastUpdatedAt: Date.now(),
            }
          : t
      )
    )

    return newMessage
  }

  const handleSendMessage = async () => {
    const trimmedInput = inputValue.trim()
    if (!trimmedInput) return

    const userMessage = addMessage({
      role: "user",
      content: trimmedInput,
    })

    setInputValue("")
    setIsTyping(true)

    try {
      let searchContext = ""
      
      if (webSearchEnabled) {
        setIsSearching(true)
        setWebSearchQuery(trimmedInput)
        
        const searchPrompt = window.spark.llmPrompt`Based on this user question, generate 5 realistic web search results that would be relevant and helpful. Return a JSON object with a "results" property containing an array of search results.

User question: "${trimmedInput}"

Each result should have:
- title: A realistic page title
- snippet: A 2-3 sentence summary of what the page contains
- url: A realistic URL (use real domain names like wikipedia.org, github.com, etc.)

Return ONLY the JSON object, no other text.`

        try {
          const searchJson = await window.spark.llm(searchPrompt, "gpt-4o-mini", true)
          const searchData = JSON.parse(searchJson)
          
          if (searchData.results && Array.isArray(searchData.results)) {
            setWebSearchResults(searchData.results)
            
            if (rememberWebSearch) {
              searchContext = `\n\nWeb Search Results:\n${searchData.results
                .map((r: SearchResult, i: number) => `${i + 1}. ${r.title}\n   ${r.snippet}\n   Source: ${r.url}`)
                .join("\n\n")}`
            }
          }
        } catch (error) {
          console.error("Web search failed:", error)
        } finally {
          setIsSearching(false)
        }
      }

      const knowledgeContext =
        (knowledgeFiles || []).length > 0
          ? `\n\nKnowledge Base Files:\n${(knowledgeFiles || []).map((f) => `- ${f.name} (${f.type})`).join("\n")}`
          : ""

      const chatbotName = currentUser?.chatbotName || "Assistant"
      const preferredName = currentUser?.preferredName || currentUser?.username || "there"
      const personalityPreset = currentUser?.personalityPreset || "default"

      const baseSystemPrompt = getPersonalityPrompt(personalityPreset)
      const systemPrompt = `You are ${chatbotName}. Address the user as ${preferredName}. ${baseSystemPrompt}`

      const conversationHistory = messages
        .slice(-5)
        .map((m) => `${m.role === "user" ? preferredName : chatbotName}: ${m.content}`)
        .join("\n")

      const prompt = window.spark.llmPrompt`${systemPrompt}

${conversationHistory ? `Recent conversation:\n${conversationHistory}\n` : ""}
${knowledgeContext}${searchContext}

${preferredName}: ${trimmedInput}

${chatbotName}:`

      const response = await window.spark.llm(prompt, "gpt-4o")

      addMessage({
        role: "bot",
        content: response,
      })
    } catch (error) {
      console.error("Error getting bot response:", error)
      addMessage({
        role: "bot",
        content: "I apologize, but I encountered an error. Please try again.",
      })
      toast.error("Failed to get response")
    } finally {
      setIsTyping(false)
    }
  }

  const handleVoiceInput = () => {
    if (!isSupported) {
      toast.error("Voice input is not supported in your browser")
      return
    }

    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  const handleImageClick = (imageUrl: string) => {
    setImageEditorUrl(imageUrl)
    setImageEditorMode("edit")
    setImageEditorOpen(true)
  }

  const handleImageSaveToChat = (imageDataUrl: string) => {
    const attachment: MessageAttachment = {
      id: `img-${Date.now()}`,
      name: "generated-image.png",
      type: "image/png",
      url: imageDataUrl,
    }

    addMessage({
      role: "user",
      content: "Here's an image I created:",
      attachments: [attachment],
    })

    toast.success("Image added to chat")
  }

  const handleStorySaveToChat = (storyText: string) => {
    addMessage({
      role: "user",
      content: storyText,
    })

    toast.success("Story added to chat")
  }

  return (
    <div className="min-h-screen bg-black text-foreground flex flex-col">
      <Toaster position="top-right" richColors />
      <header className="border-b border-border bg-black px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={mouthIcon} alt="Chatter Box" className="w-12 h-12 object-contain" />
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Henny Penny', cursive" }}>
            Chatter Box
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <ConversationThreads
            threads={(threads || []).map(t => ({
              id: t.id,
              title: t.title,
              createdAt: t.createdAt,
              lastUpdatedAt: t.lastUpdatedAt,
              messageCount: t.messageIds.length,
              archived: t.archived
            }))}
            currentThreadId={currentThreadId || "default"}
            onThreadSelect={(threadId) => {
              setCurrentThreadId(threadId)
            }}
            onThreadCreate={(title) => {
              const newThread: Thread = {
                id: `thread-${Date.now()}`,
                title,
                messageIds: [],
                createdAt: Date.now(),
                lastUpdatedAt: Date.now(),
                archived: false,
              }
              setThreads((prev) => [...(prev || []), newThread])
              setCurrentThreadId(newThread.id)
            }}
            onThreadRename={(threadId: string, newTitle: string) => {
              setThreads((prev) => (prev || []).map((t) => (t.id === threadId ? { ...t, title: newTitle } : t)))
            }}
            onThreadArchive={(threadId: string) => {
              setThreads((prev) => (prev || []).map((t) => (t.id === threadId ? { ...t, archived: true } : t)))
              if (currentThreadId === threadId) {
                const activeThreads = (threads || []).filter((t) => !t.archived && t.id !== threadId)
                if (activeThreads.length > 0) {
                  setCurrentThreadId(activeThreads[0].id)
                }
              }
            }}
            onThreadUnarchive={(threadId: string) => {
              setThreads((prev) => (prev || []).map((t) => (t.id === threadId ? { ...t, archived: false } : t)))
            }}
            onBulkArchive={(threadIds: string[]) => {
              setThreads((prev) => (prev || []).map((t) => 
                threadIds.includes(t.id) ? { ...t, archived: true } : t
              ))
            }}
            onBulkUnarchive={(threadIds: string[]) => {
              setThreads((prev) => (prev || []).map((t) => 
                threadIds.includes(t.id) ? { ...t, archived: false } : t
              ))
            }}
            onThreadDelete={(threadId: string) => {
              const activeThreads = (threads || []).filter((t) => !t.archived && t.id !== threadId)
              
              if (activeThreads.length === 0) {
                toast.error("Cannot delete the last active thread")
                return
              }

              setThreads((prev) => (prev || []).filter((t) => t.id !== threadId))

              if (currentThreadId === threadId) {
                setCurrentThreadId(activeThreads[0].id)
              }

              const threadMessages = (threads || []).find((t) => t.id === threadId)?.messageIds || []
              setAllMessages((prev) => {
                const newMessages = { ...(prev || {}) }
                threadMessages.forEach((msgId) => delete newMessages[msgId])
                return newMessages
              })

              toast.success("Thread deleted")
            }}
          />
          <Button variant="ghost" size="sm" onClick={() => setImageEditorOpen(true)}>
            <Image className="w-5 h-5 text-white" weight="fill" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setStoryCreatorOpen(true)}>
            <BookOpen className="w-5 h-5 text-white" weight="fill" />
          </Button>
          <UserAccount
            currentUser={currentUser || null}
            onLogin={handleLogin}
            onLogout={handleLogout}
            onOpenSettings={() => setSettingsOpen(true)}
            webSearchEnabled={webSearchEnabled || false}
            onToggleWebSearch={() => setWebSearchEnabled((prev) => !prev)}
            rememberWebSearch={rememberWebSearch || false}
            onToggleRememberWebSearch={() => setRememberWebSearch((prev) => !prev)}
          />
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="max-w-4xl mx-auto space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Robot className="w-16 h-16 mx-auto mb-4 opacity-50" weight="fill" />
                  <p className="text-lg">Start a conversation with {currentUser?.chatbotName || "your AI assistant"}</p>
                  <p className="text-sm mt-2">Upload knowledge files or just ask a question!</p>
                </div>
              )}
              <AnimatePresence mode="popLayout">
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    onImageClick={handleImageClick}
                    userKey={userKey}
                  />
                ))}
              </AnimatePresence>
              {isTyping && <TypingIndicator />}
              {webSearchResults && webSearchResults.length > 0 && (
                <WebSearch
                  results={webSearchResults}
                  query={webSearchQuery}
                  isSearching={isSearching}
                  onClose={() => setWebSearchResults(null)}
                />
              )}
            </div>
          </ScrollArea>

          <div className="border-t border-border bg-black p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-2 items-end">
                <div className="flex-1 relative">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    placeholder={`Message ${currentUser?.chatbotName || "Assistant"}...`}
                    className="pr-12 bg-black border-input"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`absolute right-1 top-1/2 -translate-y-1/2 ${
                      isListening ? "text-destructive animate-pulse" : "text-muted-foreground"
                    }`}
                    onClick={handleVoiceInput}
                  >
                    {isListening ? <MicrophoneSlash weight="fill" /> : <Microphone weight="fill" />}
                  </Button>
                </div>
                <Button onClick={handleSendMessage} disabled={!inputValue.trim() || isTyping} size="icon">
                  <PaperPlaneRight weight="fill" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden lg:block w-80 border-l border-border">
          <KnowledgeBase
            files={knowledgeFiles || []}
            onAddFile={(file) => setKnowledgeFiles((prev) => [...(prev || []), file])}
            onRemoveFile={(id) => setKnowledgeFiles((prev) => (prev || []).filter((f) => f.id !== id))}
          />
        </div>
      </div>

      <ImageEditor
        open={imageEditorOpen}
        onClose={() => {
          setImageEditorOpen(false)
          setImageEditorUrl(undefined)
        }}
        imageUrl={imageEditorUrl}
        mode={imageEditorMode}
        onSaveToChat={handleImageSaveToChat}
      />

      <StoryCreator
        open={storyCreatorOpen}
        onClose={() => setStoryCreatorOpen(false)}
        onSaveToChat={handleStorySaveToChat}
      />

      <ProfileSettings
        currentUser={currentUser || { id: userKey, username: "Guest", email: "guest@example.com", createdAt: Date.now() }}
        onUpdateProfile={(updatedUser) => setCurrentUser(updatedUser)}
        knowledgeFiles={knowledgeFiles || []}
        onAddFile={(file) => setKnowledgeFiles((prev) => [...(prev || []), file])}
        onRemoveFile={(id) => setKnowledgeFiles((prev) => (prev || []).filter((f) => f.id !== id))}
        threads={(threads || []).map(t => ({
          id: t.id,
          title: t.title,
          createdAt: t.createdAt,
          lastUpdatedAt: t.lastUpdatedAt,
          messageCount: t.messageIds.length,
          archived: t.archived
        }))}
        currentThreadId={currentThreadId || "default"}
        onThreadSelect={(threadId) => setCurrentThreadId(threadId)}
        onThreadCreate={(title) => {
          const newThread: Thread = {
            id: `thread-${Date.now()}`,
            title,
            messageIds: [],
            createdAt: Date.now(),
            lastUpdatedAt: Date.now(),
            archived: false,
          }
          setThreads((prev) => [...(prev || []), newThread])
          setCurrentThreadId(newThread.id)
        }}
        onThreadRename={(threadId: string, newTitle: string) => {
          setThreads((prev) => (prev || []).map((t) => (t.id === threadId ? { ...t, title: newTitle } : t)))
        }}
        onThreadArchive={(threadId: string) => {
          setThreads((prev) => (prev || []).map((t) => (t.id === threadId ? { ...t, archived: true } : t)))
          if (currentThreadId === threadId) {
            const activeThreads = (threads || []).filter((t) => !t.archived && t.id !== threadId)
            if (activeThreads.length > 0) {
              setCurrentThreadId(activeThreads[0].id)
            }
          }
        }}
        onThreadUnarchive={(threadId: string) => {
          setThreads((prev) => (prev || []).map((t) => (t.id === threadId ? { ...t, archived: false } : t)))
        }}
        onBulkArchive={(threadIds: string[]) => {
          setThreads((prev) => (prev || []).map((t) => 
            threadIds.includes(t.id) ? { ...t, archived: true } : t
          ))
        }}
        onBulkUnarchive={(threadIds: string[]) => {
          setThreads((prev) => (prev || []).map((t) => 
            threadIds.includes(t.id) ? { ...t, archived: false } : t
          ))
        }}
        onThreadDelete={(threadId: string) => {
          const activeThreads = (threads || []).filter((t) => !t.archived && t.id !== threadId)
          
          if (activeThreads.length === 0) {
            toast.error("Cannot delete the last active thread")
            return
          }

          setThreads((prev) => (prev || []).filter((t) => t.id !== threadId))

          if (currentThreadId === threadId) {
            setCurrentThreadId(activeThreads[0].id)
          }

          const threadMessages = (threads || []).find((t) => t.id === threadId)?.messageIds || []
          setAllMessages((prev) => {
            const newMessages = { ...(prev || {}) }
            threadMessages.forEach((msgId) => delete newMessages[msgId])
            return newMessages
          })
        }}
        onImageSaveToChat={handleImageSaveToChat}
        onStorySaveToChat={handleStorySaveToChat}
        externalOpen={settingsOpen}
        onExternalOpenChange={setSettingsOpen}
      />
    </div>
  )
}

export default App

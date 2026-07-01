import { useState, useRef, useEffect } from "react"
import { Toaster } from "sonner"
import { UserAccount as UserAccountType } from "@/components/UserAccount"
import { UserAccount } from "@/components/UserAccount"
import { ConversationThreads, ConversationThread } from "@/components/ConversationThreads"
import { ChatMessage, Message } from "@/components/ChatMessage"
import { ProfileSettings } from "@/components/ProfileSettings"
import { KnowledgeFile } from "@/components/KnowledgeBase"
import { TypingIndicator } from "@/components/TypingIndicator"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { PaperPlaneRight } from "@phosphor-icons/react"
import { v4 as uuidv4 } from "uuid"
import { getToken, api, ChatMessage as ApiMessage } from "@/lib/api"

function App() {
  const [currentUser, setCurrentUser] = useLocalStorage<UserAccountType | null>("chatterbox_user", null)
  const [threads, setThreads] = useLocalStorage<ConversationThread[]>("chatterbox_threads", [])
  const [currentThreadId, setCurrentThreadId] = useLocalStorage<string>("chatterbox_current_thread", "")
  const [allMessages, setAllMessages] = useLocalStorage<Record<string, Message[]>>("chatterbox_messages", {})
  const [knowledgeFiles, setKnowledgeFiles] = useLocalStorage<KnowledgeFile[]>("chatterbox_knowledge", [])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const messages = currentThreadId ? (allMessages[currentThreadId] ?? []) : []

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  // Restore user from token on mount
  useEffect(() => {
    const token = getToken()
    if (token && !currentUser) {
      api.user.me().then(u => {
        setCurrentUser({
          id: u.id,
          username: u.username,
          email: u.email,
          displayName: u.displayName,
          avatarUrl: u.avatarUrl,
          preferredName: u.preferredName,
          chatbotName: u.chatbotName,
          personalityPreset: u.personalityPreset,
          createdAt: new Date(u.createdAt).getTime(),
        })
      }).catch(() => {})
    }
  }, [])

  // Thread management
  const handleThreadCreate = (title: string) => {
    const thread: ConversationThread = {
      id: uuidv4(),
      title,
      createdAt: Date.now(),
      lastUpdatedAt: Date.now(),
      messageCount: 0,
    }
    setThreads(prev => [thread, ...prev])
    setCurrentThreadId(thread.id)
  }

  const handleThreadSelect = (threadId: string) => setCurrentThreadId(threadId)

  const handleThreadDelete = (threadId: string) => {
    setThreads(prev => prev.filter(t => t.id !== threadId))
    setAllMessages(prev => { const n = { ...prev }; delete n[threadId]; return n })
    if (currentThreadId === threadId) setCurrentThreadId("")
  }

  const handleThreadRename = (threadId: string, newTitle: string) => {
    setThreads(prev => prev.map(t => t.id === threadId ? { ...t, title: newTitle } : t))
  }

  const handleThreadArchive = (threadId: string) => {
    setThreads(prev => prev.map(t => t.id === threadId ? { ...t, archived: true } : t))
  }

  const handleThreadUnarchive = (threadId: string) => {
    setThreads(prev => prev.map(t => t.id === threadId ? { ...t, archived: false } : t))
  }

  const handleBulkArchive = (ids: string[]) => {
    setThreads(prev => prev.map(t => ids.includes(t.id) ? { ...t, archived: true } : t))
  }

  const handleBulkUnarchive = (ids: string[]) => {
    setThreads(prev => prev.map(t => ids.includes(t.id) ? { ...t, archived: false } : t))
  }

  const addMessage = (threadId: string, message: Message) => {
    setAllMessages(prev => ({
      ...prev,
      [threadId]: [...(prev[threadId] ?? []), message],
    }))
    setThreads(prev => prev.map(t =>
      t.id === threadId
        ? { ...t, lastUpdatedAt: Date.now(), messageCount: (t.messageCount ?? 0) + 1 }
        : t
    ))
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text) return

    let threadId = currentThreadId
    if (!threadId) {
      const thread: ConversationThread = {
        id: uuidv4(),
        title: text.slice(0, 40),
        createdAt: Date.now(),
        lastUpdatedAt: Date.now(),
        messageCount: 0,
      }
      setThreads(prev => [thread, ...prev])
      setCurrentThreadId(thread.id)
      threadId = thread.id
    }

    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    }
    addMessage(threadId, userMessage)
    setInput("")
    setIsTyping(true)

    try {
      // Build conversation history for context
      const history: ApiMessage[] = (allMessages[threadId] ?? [])
        .concat(userMessage)
        .map(m => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.content,
        }))

      const systemPrompt = currentUser?.personalityPreset
        ? `You are ${currentUser.chatbotName || "a helpful assistant"}. ${currentUser.personalityPreset}`
        : `You are ${currentUser?.chatbotName || "a helpful assistant"}.`

      const { content } = await api.chat.send(history, systemPrompt)

      addMessage(threadId, {
        id: uuidv4(),
        role: "bot",
        content,
        timestamp: Date.now(),
      })
    } catch (err) {
      addMessage(threadId, {
        id: uuidv4(),
        role: "bot",
        content: err instanceof Error ? `Error: ${err.message}` : "Something went wrong. Please try again.",
        timestamp: Date.now(),
      })
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const chatbotName = currentUser?.chatbotName || "Chatter Box"

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Toaster richColors position="top-right" />

      {/* Header */}
      <header className="border-b px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <ConversationThreads
            threads={threads}
            currentThreadId={currentThreadId}
            onThreadSelect={handleThreadSelect}
            onThreadCreate={handleThreadCreate}
            onThreadDelete={handleThreadDelete}
            onThreadRename={handleThreadRename}
            onThreadArchive={handleThreadArchive}
            onThreadUnarchive={handleThreadUnarchive}
            onBulkArchive={handleBulkArchive}
            onBulkUnarchive={handleBulkUnarchive}
          />
          <span className="font-semibold text-lg">{chatbotName}</span>
        </div>
        <UserAccount
          currentUser={currentUser}
          onLogin={setCurrentUser}
          onLogout={() => setCurrentUser(null)}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-6 max-w-3xl w-full mx-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 text-muted-foreground mt-20">
            <p className="text-2xl font-semibold">{chatbotName}</p>
            <p>Start a conversation below.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map(msg => (
              <ChatMessage
                key={msg.id}
                message={msg}
                userKey={currentUser?.id ?? "guest"}
              />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Input */}
      <div className="border-t px-4 py-3 max-w-3xl w-full mx-auto w-full">
        <div className="flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
            rows={1}
            className="resize-none flex-1"
          />
          <Button onClick={handleSend} disabled={!input.trim()} size="icon">
            <PaperPlaneRight size={18} />
          </Button>
        </div>
      </div>

      {/* Profile settings dialog */}
      {currentUser && (
        <ProfileSettings
          currentUser={currentUser}
          onUpdateProfile={setCurrentUser}
          knowledgeFiles={knowledgeFiles}
          onAddFile={f => setKnowledgeFiles(prev => [...prev, f])}
          onRemoveFile={id => setKnowledgeFiles(prev => prev.filter(f => f.id !== id))}
          threads={threads}
          currentThreadId={currentThreadId}
          onThreadSelect={handleThreadSelect}
          onThreadCreate={handleThreadCreate}
          onThreadDelete={handleThreadDelete}
          onThreadRename={handleThreadRename}
          onThreadArchive={handleThreadArchive}
          onThreadUnarchive={handleThreadUnarchive}
          onBulkArchive={handleBulkArchive}
          onBulkUnarchive={handleBulkUnarchive}
          onImageSaveToChat={imgUrl => {
            if (!currentThreadId) return
            addMessage(currentThreadId, { id: uuidv4(), role: "user", content: imgUrl, timestamp: Date.now() })
          }}
          onStorySaveToChat={storyText => {
            if (!currentThreadId) return
            addMessage(currentThreadId, { id: uuidv4(), role: "user", content: storyText, timestamp: Date.now() })
          }}
          externalOpen={settingsOpen}
          onExternalOpenChange={setSettingsOpen}
        />
      )}
    </div>
  )
}

export default App

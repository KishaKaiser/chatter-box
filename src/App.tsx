import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from "react"
import { useKV } from "@github/spark/hooks"
import { api, getToken, removeToken } from "@/lib/api"
import { PaperPlaneRight, Sparkle, Microphone, MicrophoneSlash, DownloadSimple, Paperclip, X, Chat, Image, PaintBrush, BookOpen } from "@phosphor-icons/react"
import { Card } from "@/components/ui/card"
import mouthIcon from '@/assets/images/mouth.jpg'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChatMessage, Message, MessageAttachment } from "@/components/ChatMessage"
import { TypingIndicator } from "@/components/TypingIndicator"
import { KnowledgeFile } from "@/components/KnowledgeBase"
import { UserAccount, UserAccount as UserAccountType } from "@/components/UserAccount"
import { ProfileSettings } from "@/components/ProfileSettings"
import { ConversationThread } from "@/components/ConversationThreads"
import { TextToImage } from "@/components/TextToImage"
import { ImageEditor } from "@/components/ImageEditor"
import { StoryCreator } from "@/components/StoryCreator"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { useIsMobile } from "@/hooks/use-mobile"
import { useVoiceInput } from "@/hooks/use-voice-input"
import { motion, AnimatePresence } from "framer-motion"
import { getPersonalityPrompt, PERSONALITY_PRESETS } from "@/lib/personality-presets"

function App() {
  const isMobile = useIsMobile()
  const [currentUser, setCurrentUser] = useKV<UserAccountType | null>("current-user", null)
  const userKey = (currentUser?.id || "guest")
  const [threads, setThreads] = useKV<ConversationThread[]>(`conversation-threads-${userKey}`, [])
  const [currentThreadId, setCurrentThreadId] = useKV<string>(`current-thread-${userKey}`, "")
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [pendingAttachments, setPendingAttachments] = useState<MessageAttachment[]>([])
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const [webSearchEnabled, setWebSearchEnabled] = useKV<boolean>(`web-search-enabled-${userKey}`, false)
  const [rememberWebSearch, setRememberWebSearch] = useKV<boolean>(`remember-web-search-${userKey}`, false)
  const [webSearchMemory, setWebSearchMemory] = useKV<string>(`web-search-memory-${userKey}`, "")
  const [isSearching, setIsSearching] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"chat" | "create-image" | "edit-image" | "story">("chat")
  const [imageEditorOpen, setImageEditorOpen] = useState(false)
  const [imageEditorMode, setImageEditorMode] = useState<"edit" | "create" | "enhance">("create")
  const [imageToEdit, setImageToEdit] = useState<string | undefined>(undefined)
  const [storyCreatorOpen, setStoryCreatorOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Restore session from stored JWT on app load
  useEffect(() => {
    const token = getToken()
    if (token && !currentUser) {
      api.user.me().then((apiUser) => {
        setCurrentUser((prev) => prev || {
          id: apiUser.id,
          username: apiUser.username,
          email: apiUser.email,
          createdAt: new Date(apiUser.createdAt).getTime(),
          displayName: apiUser.displayName,
          avatarUrl: apiUser.avatarUrl,
          preferredName: apiUser.preferredName,
          chatbotName: apiUser.chatbotName,
          personalityPreset: apiUser.personalityPreset,
        })
      }).catch((error) => {
        console.error("Failed to restore user session:", error)
        removeToken()
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const threadList = threads || []
    if (threadList.length === 0) {
      const defaultThread: ConversationThread = {
        id: `thread-${Date.now()}`,
        title: "General Chat",
        createdAt: Date.now(),
        lastUpdatedAt: Date.now(),
        messageCount: 0,
      }
      setThreads([defaultThread])
      setCurrentThreadId(defaultThread.id)
    } else if (!currentThreadId || !threadList.find(t => t.id === currentThreadId)) {
      setCurrentThreadId(threadList[0].id)
    }
  }, [threads, currentThreadId, setThreads, setCurrentThreadId])

  useEffect(() => {
    const autoArchiveOldThreads = () => {
      const now = Date.now()
      const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000
      
      setThreads((current) => {
        const threadList = current || []
        const updated = threadList.map((thread) => {
          if (!thread.archived && (now - thread.lastUpdatedAt) > thirtyDaysInMs) {
            return { ...thread, archived: true }
          }
          return thread
        })
        
        const archivedCount = updated.filter((t, i) => 
          !threadList[i]?.archived && t.archived
        ).length
        
        if (archivedCount > 0) {
          toast.info(
            `${archivedCount} conversation${archivedCount > 1 ? 's' : ''} automatically archived (older than 30 days)`,
            { duration: 5000 }
          )
        }
        
        return updated
      })
    }

    autoArchiveOldThreads()
  }, [])

  const threadList = threads || []
  const activeThreads = threadList.filter(t => !t.archived)
  const activeThreadId = currentThreadId || activeThreads[0]?.id || ""
  const [messages, setMessages] = useKV<Message[]>(`chat-messages-${userKey}-${activeThreadId}`, [])
  const [knowledgeFiles, setKnowledgeFiles] = useKV<KnowledgeFile[]>(`knowledge-files-${userKey}`, [])
  
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

  const generateBotResponse = async (userMessage: string, attachments?: MessageAttachment[]): Promise<string> => {
    let webSearchContext = ""
    let citedSources = ""
    
    if (webSearchEnabled) {
      setIsSearching(true)
      
      try {
        const results = await performWebSearch(userMessage)
        
        if (results.length > 0) {
          webSearchContext = "\n\nWeb Search Results:\n" + 
            results.map((r, i) => 
              `${i + 1}. ${r.title}\n   ${r.snippet}\n   Source: ${r.url}`
            ).join("\n\n")
          
          citedSources = "\n\n---\n**Sources:**\n" + 
            results.map((r, i) => `${i + 1}. [${r.title}](${r.url})`).join("\n")
          
          if (rememberWebSearch) {
            const newMemoryEntry = `\n\n[${new Date().toLocaleDateString()}] Query: "${userMessage}"\nKey findings: ${results.map(r => r.snippet).join(' ')}`
            setWebSearchMemory((current) => (current || "") + newMemoryEntry)
          }
        }
      } catch (error) {
        console.error("Web search error:", error)
        toast.error("Web search failed, continuing with knowledge base only")
      } finally {
        setIsSearching(false)
      }
    }

    const files = knowledgeFiles || []
    const knowledgeContext = files
      .map((file) => {
        if (file.type.startsWith("image/")) {
          return `File: ${file.name} (Image - visual content available)`
        }
        return `File: ${file.name}\nContent: ${file.content.slice(0, 500)}...`
      })
      .join("\n\n")

    let attachmentContext = ""
    if (attachments && attachments.length > 0) {
      const imageAttachments = attachments.filter(att => att.type.includes("image"))
      const otherAttachments = attachments.filter(att => !att.type.includes("image"))
      
      if (imageAttachments.length > 0) {
        attachmentContext = "\n\nThe user has shared the following image(s) with you:\n" + 
          imageAttachments.map(att => `- ${att.name}`).join("\n")
      }
      
      if (otherAttachments.length > 0) {
        attachmentContext += "\n\nThe user has attached the following files:\n" + 
          otherAttachments.map(att => `- ${att.name} (${att.type})`).join("\n")
      }
    }

    const contextPart = knowledgeContext || "No documents uploaded yet."
    const memoryPart = rememberWebSearch && webSearchMemory ? `\n\nPreviously learned from web searches:\n${webSearchMemory}` : ""
    
    const botName = currentUser?.chatbotName || "Chatter Box"
    const userName = currentUser?.preferredName || currentUser?.displayName || currentUser?.username || "there"
    const personalityPrompt = getPersonalityPrompt(currentUser?.personalityPreset)
    
    const promptText = window.spark.llmPrompt`You are ${botName}, a helpful AI assistant. ${personalityPrompt}

When addressing the user, call them "${userName}". You have access to the following knowledge base:

${contextPart}${attachmentContext}${webSearchContext}${memoryPart}

User question: ${userMessage}

Provide a helpful response that matches your personality style. Address the user as "${userName}" occasionally in your responses to make it more personal. If the user has shared images with you, acknowledge them briefly and naturally (e.g., "Thanks for sharing the image!" or "I can see you've created an image"). If the question relates to the uploaded documents, attached files, or web search results, reference them specifically. If web search results are provided, cite the sources by mentioning the website names in your response naturally. If you don't have relevant information in your knowledge base, be honest about it and still try to help with general knowledge.

When including code snippets in your response, always use markdown code blocks with the language specified for proper syntax highlighting. For example:
\`\`\`javascript
const example = "code here";
\`\`\`

or

\`\`\`python
def example():
    return "code here"
\`\`\`
`

    try {
      const response = await window.spark.llm(promptText, "gpt-4o-mini")
      return response + citedSources
    } catch (error) {
      console.error("Error generating response:", error)
      return "I'm having trouble generating a response right now. Please try again in a moment."
    }
  }

  const performWebSearch = async (query: string): Promise<Array<{ title: string; snippet: string; url: string; favicon?: string }>> => {
    const searchPrompt = window.spark.llmPrompt`You are a web search assistant. Based on the user's query, generate 5 realistic web search results that would help answer their question.

User query: ${query}

Return results as a JSON object with a "results" array. Each result should have:
- title: A realistic webpage title
- snippet: A 2-3 sentence excerpt that would appear in search results
- url: A realistic URL for the source (use real domains like wikipedia.org, stackoverflow.com, github.com, etc.)

Make the results relevant, helpful, and diverse. Include authoritative sources when appropriate.`

    try {
      const response = await window.spark.llm(searchPrompt, "gpt-4o-mini", true)
      const data = JSON.parse(response)
      
      if (data.results && Array.isArray(data.results)) {
        return data.results.map((r: any) => ({
          title: r.title || "Untitled",
          snippet: r.snippet || "",
          url: r.url || "#",
          favicon: r.url ? `https://www.google.com/s2/favicons?domain=${new URL(r.url).hostname}&sz=32` : undefined
        }))
      }
      
      return []
    } catch (error) {
      console.error("Search parsing error:", error)
      return []
    }
  }

  const updateThreadMetadata = (messageCount: number) => {
    setThreads((current) =>
      (current || []).map((t) =>
        t.id === activeThreadId
          ? { ...t, lastUpdatedAt: Date.now(), messageCount }
          : t
      )
    )
  }

  const handleSendMessage = async () => {
    if ((!inputValue.trim() && pendingAttachments.length === 0) || isTyping) return

    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: "user",
      content: inputValue.trim() || "(File attached)",
      timestamp: Date.now(),
      attachments: pendingAttachments.length > 0 ? [...pendingAttachments] : undefined,
    }

    setMessages((current) => [...(current || []), userMessage])
    setInputValue("")
    setPendingAttachments([])
    setIsTyping(true)

    const botResponse = await generateBotResponse(userMessage.content, userMessage.attachments)

    const botMessage: Message = {
      id: `${Date.now()}-bot`,
      role: "bot",
      content: botResponse,
      timestamp: Date.now(),
    }

    setMessages((current) => {
      const updated = [...(current || []), botMessage]
      updateThreadMetadata(updated.length)
      return updated
    })
    setIsTyping(false)
    inputRef.current?.focus()
  }

  const handleRegenerateResponse = async (messageId: string) => {
    const msgList = currentMessages || []
    const messageIndex = msgList.findIndex(m => m.id === messageId)
    
    if (messageIndex === -1 || msgList[messageIndex].role !== "bot") return
    
    const previousUserMessage = msgList
      .slice(0, messageIndex)
      .reverse()
      .find(m => m.role === "user")
    
    if (!previousUserMessage) return

    setIsTyping(true)
    
    const newBotResponse = await generateBotResponse(previousUserMessage.content, previousUserMessage.attachments)
    
    setMessages((current) => {
      const updated = [...(current || [])]
      const targetIndex = updated.findIndex(m => m.id === messageId)
      if (targetIndex !== -1) {
        updated[targetIndex] = {
          ...updated[targetIndex],
          content: newBotResponse,
          timestamp: Date.now(),
        }
      }
      return updated
    })
    
    setIsTyping(false)
    toast.success("Response regenerated")
  }

  const handleThreadSelect = (threadId: string) => {
    setCurrentThreadId(threadId)
  }

  const handleThreadCreate = (title: string) => {
    const newThread: ConversationThread = {
      id: `thread-${Date.now()}`,
      title,
      createdAt: Date.now(),
      lastUpdatedAt: Date.now(),
      messageCount: 0,
    }
    setThreads((current) => [...(current || []), newThread])
    setCurrentThreadId(newThread.id)
    toast.success(`Created "${title}"`)
  }

  const handleThreadDelete = (threadId: string) => {
    const threadToDelete = threadList.find(t => t.id === threadId)
    if (!threadToDelete) return

    setThreads((current) => {
      const filtered = (current || []).filter((t) => t.id !== threadId)
      if (threadId === activeThreadId && filtered.length > 0) {
        setCurrentThreadId(filtered[0].id)
      }
      return filtered
    })
    
    toast.success(`Deleted "${threadToDelete.title}"`)
  }

  const handleThreadRename = (threadId: string, newTitle: string) => {
    setThreads((current) =>
      (current || []).map((t) =>
        t.id === threadId ? { ...t, title: newTitle } : t
      )
    )
    toast.success("Thread renamed")
  }

  const handleThreadArchive = (threadId: string) => {
    const thread = threadList.find(t => t.id === threadId)
    if (!thread) return

    setThreads((current) =>
      (current || []).map((t) =>
        t.id === threadId ? { ...t, archived: true } : t
      )
    )

    if (threadId === activeThreadId) {
      const remainingActive = activeThreads.filter(t => t.id !== threadId)
      if (remainingActive.length > 0) {
        setCurrentThreadId(remainingActive[0].id)
      }
    }

    toast.success(`"${thread.title}" archived`)
  }

  const handleThreadUnarchive = (threadId: string) => {
    const thread = threadList.find(t => t.id === threadId)
    if (!thread) return

    setThreads((current) =>
      (current || []).map((t) =>
        t.id === threadId ? { ...t, archived: false } : t
      )
    )
    toast.success(`"${thread.title}" restored`)
  }

  const handleBulkArchive = (threadIds: string[]) => {
    setThreads((current) =>
      (current || []).map((t) =>
        threadIds.includes(t.id) ? { ...t, archived: true } : t
      )
    )

    const remainingActive = activeThreads.filter(t => !threadIds.includes(t.id))
    if (threadIds.includes(activeThreadId) && remainingActive.length > 0) {
      setCurrentThreadId(remainingActive[0].id)
    }
  }

  const handleBulkUnarchive = (threadIds: string[]) => {
    setThreads((current) =>
      (current || []).map((t) =>
        threadIds.includes(t.id) ? { ...t, archived: false } : t
      )
    )
  }

  const handleFileSelect = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return

    const file = selectedFiles[0]
    const fileName = file.name.toLowerCase()
    
    const supportedExtensions = [
      '.txt', '.md', '.pdf', '.png', '.jpg', '.jpeg', '.zip',
      '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.h',
      '.css', '.html', '.json', '.xml', '.yaml', '.yml', '.go', '.rs',
      '.rb', '.php', '.swift', '.kt', '.sh', '.cs', '.r', '.sql', '.vue'
    ]

    const isSupported = supportedExtensions.some(ext => fileName.endsWith(ext))

    if (!isSupported) {
      toast.error("Unsupported file type. Please upload code files, documents, images, or ZIP archives.")
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB")
      return
    }

    const attachment: MessageAttachment = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: file.name,
      type: file.type || 'application/octet-stream',
      size: file.size,
    }

    setPendingAttachments((current) => [...current, attachment])
    toast.success(`${file.name} attached`)
  }

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeAttachment = (id: string) => {
    setPendingAttachments((current) => current.filter((att) => att.id !== id))
  }

  const handleImageSaveToChat = (imageDataUrl: string) => {
    const imageAttachment: MessageAttachment = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: `image-${Date.now()}.png`,
      type: 'image/png',
      url: imageDataUrl,
    }
    
    setPendingAttachments((current) => [...current, imageAttachment])
  }

  const handleStorySaveToChat = (storyText: string) => {
    if (!storyText.trim()) return

    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: "user",
      content: storyText,
      timestamp: Date.now(),
    }

    setMessages((current) => {
      const updated = [...(current || []), userMessage]
      updateThreadMetadata(updated.length)
      return updated
    })
  }

  const handleImageClick = (imageUrl: string) => {
    toast.info("Open Settings > Images tab to edit this image")
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingFile(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingFile(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.currentTarget === chatContainerRef.current) {
      setIsDraggingFile(false)
    }
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
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

    const botName = currentUser?.chatbotName || "Chatter Box"
    const userName = currentUser?.preferredName || currentUser?.displayName || currentUser?.username || "User"

    let content = `${botName} - Conversation Export\n`
    content += "=" + "=".repeat(50) + "\n\n"
    
    currentMessages.forEach((msg) => {
      const role = msg.role === "user" ? userName : botName
      const timestamp = formatTimestamp(msg.timestamp)
      content += `[${timestamp}] ${role}:\n${msg.content}\n\n`
    })

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${botName.toLowerCase().replace(/\s+/g, '-')}-export-${Date.now()}.txt`
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

    const botName = currentUser?.chatbotName || "Chatter Box"
    const userName = currentUser?.preferredName || currentUser?.displayName || currentUser?.username || "User"

    const exportData = {
      exportDate: new Date().toISOString(),
      messageCount: currentMessages.length,
      chatbotName: botName,
      userName: userName,
      messages: currentMessages.map(msg => ({
        role: msg.role,
        sender: msg.role === "user" ? userName : botName,
        content: msg.content,
        timestamp: msg.timestamp,
        formattedTimestamp: formatTimestamp(msg.timestamp)
      }))
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${botName.toLowerCase().replace(/\s+/g, '-')}-export-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success("Conversation exported successfully")
  }

  const handleLogin = (user: UserAccountType) => {
    setCurrentUser(user)
  }

  const handleLogout = () => {
    removeToken()
    setCurrentUser(null)
  }

  const handleUpdateProfile = (updatedUser: UserAccountType) => {
    setCurrentUser(updatedUser)
  }

  const handleAddFile = (file: KnowledgeFile) => {
    setKnowledgeFiles((current) => [...(current || []), file])
  }

  const handleRemoveFile = (id: string) => {
    setKnowledgeFiles((current) => (current || []).filter((f) => f.id !== id))
  }

  const currentMessages = messages || []
  const currentFiles = knowledgeFiles || []

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <Toaster position="top-center" />
      
      <div className="max-w-4xl mx-auto">
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-background p-3 rounded-xl">
                <img src={mouthIcon} alt="Chat" className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-lg" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight" style={{ fontFamily: "'Henny Penny', cursive", letterSpacing: '-0.02em' }}>
                  {currentUser?.chatbotName || "Chatter Box"}
                </h1>
                <div className="flex items-center gap-2">
                  <p className="text-muted-foreground text-sm md:text-base">
                    Your AI assistant that learns from your documents
                  </p>
                  {currentUser && (
                    <Badge variant="secondary" className="text-xs hidden sm:flex items-center gap-1">
                      {PERSONALITY_PRESETS.find(p => p.id === currentUser.personalityPreset)?.emoji || "😊"}
                      <span className="hidden md:inline">
                        {PERSONALITY_PRESETS.find(p => p.id === currentUser.personalityPreset)?.name || "Friendly Assistant"}
                      </span>
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <UserAccount
                currentUser={currentUser || null}
                onLogin={handleLogin}
                onLogout={handleLogout}
                onOpenSettings={() => setSettingsOpen(true)}
                webSearchEnabled={webSearchEnabled}
                onToggleWebSearch={() => setWebSearchEnabled(!webSearchEnabled)}
                rememberWebSearch={rememberWebSearch}
                onToggleRememberWebSearch={() => setRememberWebSearch(!rememberWebSearch)}
              />
              {currentUser && (
                <ProfileSettings
                  currentUser={currentUser}
                  onUpdateProfile={handleUpdateProfile}
                  knowledgeFiles={currentFiles}
                  onAddFile={handleAddFile}
                  onRemoveFile={handleRemoveFile}
                  threads={threadList}
                  currentThreadId={activeThreadId}
                  onThreadSelect={handleThreadSelect}
                  onThreadCreate={handleThreadCreate}
                  onThreadDelete={handleThreadDelete}
                  onThreadRename={handleThreadRename}
                  onThreadArchive={handleThreadArchive}
                  onThreadUnarchive={handleThreadUnarchive}
                  onBulkArchive={handleBulkArchive}
                  onBulkUnarchive={handleBulkUnarchive}
                  onImageSaveToChat={handleImageSaveToChat}
                  onStorySaveToChat={handleStorySaveToChat}
                  externalOpen={settingsOpen}
                  onExternalOpenChange={setSettingsOpen}
                />
              )}
            </div>
          </div>
        </header>

        {threadList.length > 0 && activeTab === "chat" && (
          <div className="mb-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Chat size={16} weight="fill" />
              <span className="text-sm font-medium">
                {threadList.find(t => t.id === activeThreadId)?.title || "Chat"}
              </span>
            </div>
          </div>
        )}

        <Card className="border-0">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
            <div className="border-b border-border px-4 pt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="chat" className="gap-2">
                  <Chat size={18} weight="fill" />
                  {!isMobile && "Chat"}
                </TabsTrigger>
                <TabsTrigger value="create-image" className="gap-2">
                  <Sparkle size={18} weight="fill" />
                  {!isMobile && "Create AI Image"}
                </TabsTrigger>
                <TabsTrigger value="edit-image" className="gap-2">
                  <PaintBrush size={18} weight="fill" />
                  {!isMobile && "Edit Image"}
                </TabsTrigger>
                <TabsTrigger value="story" className="gap-2">
                  <BookOpen size={18} weight="fill" />
                  {!isMobile && "Create A Story"}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="chat" className="m-0">
              <div
                ref={chatContainerRef}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className="flex flex-col h-[calc(100vh-240px)] relative"
              >
                {isDraggingFile && (
                  <div className="absolute inset-0 z-50 bg-accent/20 backdrop-blur-sm border-4 border-accent border-dashed rounded-lg flex items-center justify-center">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-card p-8 rounded-2xl shadow-2xl border-2 border-accent"
                    >
                      <Paperclip size={48} className="text-accent mx-auto mb-3" weight="fill" />
                      <p className="text-lg font-semibold text-center">Drop file here</p>
                      <p className="text-sm text-muted-foreground text-center mt-1">
                        Code files, documents, images, ZIP (max 10MB)
                      </p>
                    </motion.div>
                  </div>
                )}
                
                <ScrollArea className="flex-1 p-6" ref={scrollRef}>
                  <div className="space-y-4">
                    {currentMessages.length === 0 && (
                      <div className="text-center py-12">
                        <div className="w-24 h-24 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                          <img src={mouthIcon} alt="Chat" className="w-16 h-16 object-cover rounded-full" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Welcome to {currentUser?.chatbotName || "Chatter Box"}!</h3>
                        <p className="text-muted-foreground text-sm max-w-md mx-auto">
                          {currentFiles.length === 0
                            ? "Start by uploading some documents in settings, then ask me anything!"
                            : "I've learned from your documents. Ask me anything!"}
                        </p>
                      </div>
                    )}
                    
                    {currentMessages.map((message) => (
                      <ChatMessage 
                        key={message.id} 
                        message={message}
                        onRegenerate={handleRegenerateResponse}
                        onImageClick={handleImageClick}
                        userKey={userKey}
                      />
                    ))}
                    
                    {isTyping && <TypingIndicator />}
                  </div>
                </ScrollArea>

                <div className="p-4 border-t border-border">
                  {pendingAttachments.length > 0 && (
                    <div className="mb-3 space-y-2">
                      <AnimatePresence>
                        {pendingAttachments.map((attachment) => (
                          <motion.div
                            key={attachment.id}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="flex items-center gap-2 p-2 bg-accent/10 rounded-lg group"
                          >
                            <Paperclip size={16} className="text-accent" weight="fill" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{attachment.name}</p>
                              {attachment.size && (
                                <p className="text-xs text-muted-foreground">
                                  {(attachment.size / 1024).toFixed(1)} KB
                                </p>
                              )}
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeAttachment(attachment.id)}
                            >
                              <X size={14} />
                            </Button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".txt,.md,.pdf,.png,.jpg,.jpeg,.zip,.js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.h,.css,.html,.json,.xml,.yaml,.yml,.go,.rs,.rb,.php,.swift,.kt,.sh,.cs,.r,.sql,.vue"
                      onChange={handleFileInputChange}
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isTyping}
                      variant="outline"
                      className="border-accent/50 text-accent hover:bg-accent/10 active:scale-95 transition-transform"
                      size="icon"
                      title="Attach file"
                    >
                      <Paperclip size={20} weight="fill" />
                    </Button>
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
                      disabled={(!inputValue.trim() && pendingAttachments.length === 0) || isTyping}
                      className="bg-accent text-accent-foreground hover:bg-accent/90 active:scale-95 transition-transform"
                      size="icon"
                    >
                      <PaperPlaneRight size={20} weight="fill" />
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="create-image" className="m-0">
              <div className="h-[calc(100vh-240px)] overflow-auto p-6">
                <TextToImage onSaveToChat={handleImageSaveToChat} />
              </div>
            </TabsContent>

            <TabsContent value="edit-image" className="m-0">
              <div className="h-[calc(100vh-240px)] flex items-center justify-center p-6">
                <div className="text-center max-w-md">
                  <div className="w-20 h-20 mx-auto mb-6 bg-accent/10 rounded-full flex items-center justify-center">
                    <PaintBrush size={40} className="text-accent" weight="duotone" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Image Editor</h3>
                  <p className="text-muted-foreground mb-6">
                    Upload an image to edit, enhance, crop, rotate, and apply creative filters to your photos.
                  </p>
                  <Button
                    onClick={() => {
                      setImageEditorMode("edit")
                      setImageToEdit(undefined)
                      setImageEditorOpen(true)
                    }}
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                    size="lg"
                  >
                    <PaintBrush size={20} weight="fill" className="mr-2" />
                    Open Image Editor
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="story" className="m-0">
              <div className="h-[calc(100vh-240px)] flex items-center justify-center p-6">
                <div className="text-center max-w-md">
                  <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
                    <BookOpen size={40} className="text-primary" weight="duotone" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Story Creator</h3>
                  <p className="text-muted-foreground mb-6">
                    Generate detailed multi-chapter stories with AI. Choose from templates or create custom narratives.
                  </p>
                  <Button
                    onClick={() => setStoryCreatorOpen(true)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    size="lg"
                  >
                    <BookOpen size={20} weight="fill" className="mr-2" />
                    Open Story Creator
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        <ImageEditor
          open={imageEditorOpen}
          onClose={() => setImageEditorOpen(false)}
          imageUrl={imageToEdit}
          mode={imageEditorMode}
          onSaveToChat={handleImageSaveToChat}
        />

        <StoryCreator
          open={storyCreatorOpen}
          onClose={() => setStoryCreatorOpen(false)}
          onSaveToChat={handleStorySaveToChat}
        />
      </div>
    </div>
  )
}

export default App
import { useState, useRef, ChangeEvent, useEffect } from "react"
import { User as UserIcon, Camera, Check, UploadSimple, X, File, FileImage, FilePdf, FileText, BookOpen, Image as ImageIcon, Chat, SpeakerHigh, Play, Pause, Trash, MusicNote, Smiley } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { UserAccount } from "@/components/UserAccount"
import { KnowledgeFile } from "@/components/KnowledgeBase"
import { ConversationThread } from "@/components/ConversationThreads"
import { ImageEditor } from "@/components/ImageEditor"
import { StoryCreator } from "@/components/StoryCreator"
import { TextToImage } from "@/components/TextToImage"
import { VoiceSettings } from "@/hooks/use-text-to-speech"
import { useKV } from "@github/spark/hooks"
import { PERSONALITY_PRESETS } from "@/lib/personality-presets"
import { AI_MODELS, DEFAULT_MODEL } from "@/lib/ai-models"

export interface CustomVoiceFile {
  id: string
  name: string
  audioDataUrl: string
  uploadedAt: number
  duration?: number
}

interface ProfileSettingsProps {
  currentUser: UserAccount
  onUpdateProfile: (updatedUser: UserAccount) => void
  knowledgeFiles: KnowledgeFile[]
  onAddFile: (file: KnowledgeFile) => void
  onRemoveFile: (id: string) => void
  threads: ConversationThread[]
  currentThreadId: string
  onThreadSelect: (threadId: string) => void
  onThreadCreate: (title: string) => void
  onThreadDelete: (threadId: string) => void
  onThreadRename: (threadId: string, newTitle: string) => void
  onThreadArchive: (threadId: string) => void
  onThreadUnarchive: (threadId: string) => void
  onBulkArchive: (threadIds: string[]) => void
  onBulkUnarchive: (threadIds: string[]) => void
  onImageSaveToChat: (imageDataUrl: string) => void
  onStorySaveToChat: (storyText: string) => void
  externalOpen?: boolean
  onExternalOpenChange?: (open: boolean) => void
}

const AVATAR_PRESETS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Luna",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Max",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Bella",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Milo",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Chloe",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Leo",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Lily",
]

export function ProfileSettings({ 
  currentUser, 
  onUpdateProfile, 
  knowledgeFiles, 
  onAddFile, 
  onRemoveFile,
  threads,
  currentThreadId,
  onThreadSelect,
  onThreadCreate,
  onThreadDelete,
  onThreadRename,
  onThreadArchive,
  onThreadUnarchive,
  onBulkArchive,
  onBulkUnarchive,
  onImageSaveToChat,
  onStorySaveToChat,
  externalOpen,
  onExternalOpenChange
}: ProfileSettingsProps) {
  const [open, setOpen] = useState(false)
  const [displayName, setDisplayName] = useState(currentUser.displayName || currentUser.username)
  const [preferredName, setPreferredName] = useState(currentUser.preferredName || "")
  const [chatbotName, setChatbotName] = useState(currentUser.chatbotName || "Chatter Box")
  const [selectedAvatar, setSelectedAvatar] = useState(currentUser.avatarUrl || "")
  const [selectedPersonality, setSelectedPersonality] = useState(currentUser.personalityPreset || "default")
  const [selectedModel, setSelectedModel] = useState(currentUser.aiModel || DEFAULT_MODEL)
  const [customAvatarUrl, setCustomAvatarUrl] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [imageEditorOpen, setImageEditorOpen] = useState(false)
  const [imageEditorMode, setImageEditorMode] = useState<"edit" | "create" | "enhance">("create")
  const [imageToEdit, setImageToEdit] = useState<string | undefined>(undefined)
  const [storyCreatorOpen, setStoryCreatorOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isOpen = externalOpen !== undefined ? externalOpen : open
  const setIsOpen = onExternalOpenChange || setOpen

  const handleSave = () => {
    if (!displayName.trim()) {
      toast.error("Display name cannot be empty")
      return
    }

    if (displayName.length < 2) {
      toast.error("Display name must be at least 2 characters")
      return
    }

    if (chatbotName.trim().length < 2) {
      toast.error("Chatbot name must be at least 2 characters")
      return
    }

    const updatedUser: UserAccount = {
      ...currentUser,
      displayName: displayName.trim(),
      preferredName: preferredName.trim() || undefined,
      chatbotName: chatbotName.trim(),
      avatarUrl: selectedAvatar || undefined,
      personalityPreset: selectedPersonality,
      aiModel: selectedModel,
    }

    onUpdateProfile(updatedUser)
    toast.success("Profile updated successfully!")
    setIsOpen(false)
  }

  const handleCustomAvatarSubmit = () => {
    if (!customAvatarUrl.trim()) {
      toast.error("Please enter a valid URL")
      return
    }

    if (!customAvatarUrl.startsWith("http://") && !customAvatarUrl.startsWith("https://")) {
      toast.error("Avatar URL must start with http:// or https://")
      return
    }

    setSelectedAvatar(customAvatarUrl)
    setCustomAvatarUrl("")
    toast.success("Custom avatar added!")
  }

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getFileIcon = (type: string, name: string) => {
    if (type.includes("image")) return <FileImage size={16} weight="fill" />
    if (type.includes("pdf")) return <FilePdf size={16} weight="fill" />
    if (type.includes("text") || type.includes("markdown") || name.match(/\.(js|jsx|ts|tsx|py|java|cpp|c|h|css|html|json|xml|yaml|yml|go|rs|rb|php|swift|kt|sh)$/i)) return <FileText size={16} weight="fill" />
    if (type.includes("zip") || name.endsWith(".zip")) return <File size={16} weight="fill" />
    return <File size={16} weight="fill" />
  }

  const getFileTypeLabel = (type: string, name: string): string => {
    if (type.includes("image")) return "IMAGE"
    if (type.includes("pdf")) return "PDF"
    if (type.includes("text")) return "TXT"
    if (type.includes("markdown")) return "MD"
    if (type.includes("zip") || name.endsWith(".zip")) return "ZIP"
    const extension = name.split(".").pop()?.toUpperCase()
    if (extension && ["JS", "JSX", "TS", "TSX", "PY", "JAVA", "CPP", "C", "H", "CSS", "HTML", "JSON", "XML", "YAML", "YML", "GO", "RS", "RB", "PHP", "SWIFT", "KT", "SH"].includes(extension)) {
      return extension
    }
    return "FILE"
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

    try {
      let content = ""

      if (file.type.startsWith("image/")) {
        const reader = new FileReader()
        content = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.readAsDataURL(file)
        })
      } else if (file.type === "application/pdf") {
        content = "[PDF content - viewable as image data]"
        toast.info("PDF uploaded. Bot can reference this document.")
      } else if (fileName.endsWith(".zip") || file.type === "application/zip" || file.type === "application/x-zip-compressed") {
        content = "[ZIP archive - contains multiple files]"
        toast.info("ZIP file uploaded. Bot can reference this archive.")
      } else {
        content = await file.text()
      }

      const newFile: KnowledgeFile = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name: file.name,
        type: file.type || 'application/octet-stream',
        content,
        uploadedAt: Date.now(),
      }

      onAddFile(newFile)
      toast.success(`${file.name} added to knowledge base`)
    } catch (error) {
      toast.error("Failed to process file")
      console.error(error)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Settings</DialogTitle>
          <DialogDescription>
            Manage your profile and knowledge base
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-8 gap-1">
            <TabsTrigger value="profile" className="text-xs sm:text-sm">Profile</TabsTrigger>
            <TabsTrigger value="personality" className="text-xs sm:text-sm">
              <Smiley size={16} weight="fill" className="sm:mr-1" />
              <span className="hidden sm:inline">Personality</span>
            </TabsTrigger>
            <TabsTrigger value="voice" className="text-xs sm:text-sm">Voice</TabsTrigger>
            <TabsTrigger value="knowledge" className="text-xs sm:text-sm">
              Knowledge
              <Badge variant="secondary" className="ml-1 text-xs hidden sm:inline-flex">
                {knowledgeFiles.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="conversations" className="text-xs sm:text-sm">
              Chats
              <Badge variant="secondary" className="ml-1 text-xs hidden sm:inline-flex">
                {threads.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="images" className="text-xs sm:text-sm">Images</TabsTrigger>
            <TabsTrigger value="text-to-image" className="text-xs sm:text-sm">AI Art</TabsTrigger>
            <TabsTrigger value="stories" className="text-xs sm:text-sm">Stories</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6 py-4">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24 border-4 border-primary/20">
                {selectedAvatar ? (
                  <AvatarImage src={selectedAvatar} alt={displayName} />
                ) : (
                  <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                    {getUserInitials(displayName)}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="text-center">
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">{currentUser.email}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Enter display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="text-[15px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferredName">Preferred Name (How the bot addresses you)</Label>
              <Input
                id="preferredName"
                type="text"
                placeholder="e.g., Alex, Dr. Smith, friend (optional)"
                value={preferredName}
                onChange={(e) => setPreferredName(e.target.value)}
                className="text-[15px]"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use your display name
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="chatbotName">Chatbot Name</Label>
              <Input
                id="chatbotName"
                type="text"
                placeholder="Enter chatbot name"
                value={chatbotName}
                onChange={(e) => setChatbotName(e.target.value)}
                className="text-[15px]"
              />
              <p className="text-xs text-muted-foreground">
                Customize what you call your AI assistant
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="aiModel">AI Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger id="aiModel" className="w-full text-[15px]">
                  <SelectValue placeholder="Select AI model" />
                </SelectTrigger>
                <SelectContent>
                  {AI_MODELS.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">{model.name}</span>
                        <span className="text-xs text-muted-foreground">{model.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {AI_MODELS.find(m => m.id === selectedModel) && (
                  <>
                    <Badge variant="secondary" className="text-xs">
                      {AI_MODELS.find(m => m.id === selectedModel)?.speed === "fast" && "⚡ Fast"}
                      {AI_MODELS.find(m => m.id === selectedModel)?.speed === "balanced" && "⚖️ Balanced"}
                      {AI_MODELS.find(m => m.id === selectedModel)?.speed === "slow" && "🐢 Thoughtful"}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {AI_MODELS.find(m => m.id === selectedModel)?.quality === "good" && "✓ Good"}
                      {AI_MODELS.find(m => m.id === selectedModel)?.quality === "great" && "✓✓ Great"}
                      {AI_MODELS.find(m => m.id === selectedModel)?.quality === "excellent" && "✓✓✓ Excellent"}
                    </Badge>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Choose Avatar</Label>
              <div className="grid grid-cols-4 gap-3">
                {AVATAR_PRESETS.map((avatarUrl, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedAvatar(avatarUrl)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 active:scale-95 ${
                      selectedAvatar === avatarUrl
                        ? "border-accent shadow-lg"
                        : "border-border hover:border-accent/50"
                    }`}
                    title={`Avatar ${index + 1}`}
                  >
                    <img
                      src={avatarUrl}
                      alt={`Avatar ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {selectedAvatar === avatarUrl && (
                      <div className="absolute inset-0 bg-accent/20 flex items-center justify-center">
                        <div className="bg-accent rounded-full p-1">
                          <Check size={16} weight="bold" className="text-accent-foreground" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customAvatar">Or use custom URL</Label>
              <div className="flex gap-2">
                <Input
                  id="customAvatar"
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={customAvatarUrl}
                  onChange={(e) => setCustomAvatarUrl(e.target.value)}
                  className="flex-1 text-[15px]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCustomAvatarSubmit()
                    }
                  }}
                />
                <Button
                  onClick={handleCustomAvatarSubmit}
                  variant="outline"
                  className="border-accent/50 text-accent hover:bg-accent/10"
                  size="icon"
                  title="Add custom avatar"
                >
                  <Camera size={18} weight="bold" />
                </Button>
              </div>
            </div>

            {selectedAvatar && (
              <Button
                onClick={() => setSelectedAvatar("")}
                variant="outline"
                className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
              >
                Remove Avatar
              </Button>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setOpen(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 active:scale-95 transition-transform"
              >
                Save Changes
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="personality" className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="text-center pb-2">
                <h3 className="text-lg font-semibold mb-1">Chatbot Personality</h3>
                <p className="text-sm text-muted-foreground">
                  Choose how your AI assistant communicates and responds
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PERSONALITY_PRESETS.map((preset) => (
                  <motion.button
                    key={preset.id}
                    onClick={() => setSelectedPersonality(preset.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                      selectedPersonality === preset.id
                        ? "border-accent bg-accent/10 shadow-lg"
                        : "border-border hover:border-accent/50 bg-card"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-3xl flex-shrink-0">{preset.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm mb-1 flex items-center gap-2">
                          {preset.name}
                          {selectedPersonality === preset.id && (
                            <Check size={16} weight="bold" className="text-accent flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {preset.description}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {preset.traits.map((trait, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="text-xs px-2 py-0"
                            >
                              {trait}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    {selectedPersonality === preset.id && (
                      <motion.div
                        layoutId="personality-selection"
                        className="absolute inset-0 rounded-xl border-2 border-accent pointer-events-none"
                        initial={false}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </motion.button>
                ))}
              </div>

              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Smiley size={18} weight="fill" className="text-accent" />
                  Current Selection: {PERSONALITY_PRESETS.find(p => p.id === selectedPersonality)?.name}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {PERSONALITY_PRESETS.find(p => p.id === selectedPersonality)?.systemPrompt}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setIsOpen(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 active:scale-95 transition-transform"
              >
                Save Changes
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="voice" className="space-y-6 py-4">
            <VoiceTabContent currentUser={currentUser} />
          </TabsContent>

          <TabsContent value="knowledge" className="space-y-4 py-4">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                isDragging
                  ? "border-accent bg-accent/10 shadow-[0_0_15px_rgba(0,200,255,0.3)]"
                  : "border-border hover:border-accent/50 hover:bg-accent/5"
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".txt,.md,.pdf,.png,.jpg,.jpeg,.zip,.js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.h,.css,.html,.json,.xml,.yaml,.yml,.go,.rs,.rb,.php,.swift,.kt,.sh,.cs,.r,.sql,.vue"
                onChange={handleInputChange}
              />
              <UploadSimple size={40} className="mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">
                Drop files here or click to upload
              </p>
              <p className="text-xs text-muted-foreground">
                Supports code files, documents, images, and ZIP archives (max 10MB)
              </p>
            </div>

            {knowledgeFiles.length > 0 ? (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                <AnimatePresence>
                  {knowledgeFiles.map((file) => (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.25 }}
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg group hover:bg-muted/70 transition-colors"
                    >
                      <div className="text-accent">{getFileIcon(file.type, file.name)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(file.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {getFileTypeLabel(file.type, file.name)}
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation()
                          onRemoveFile(file.id)
                          toast.success("File removed from knowledge base")
                        }}
                      >
                        <X size={16} />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  No files uploaded yet. Add documents to teach the bot!
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="conversations" className="space-y-4 py-4">
            <ConversationsTabContent
              threads={threads}
              currentThreadId={currentThreadId}
              onThreadSelect={onThreadSelect}
              onThreadCreate={onThreadCreate}
              onThreadDelete={onThreadDelete}
              onThreadRename={onThreadRename}
              onThreadArchive={onThreadArchive}
              onThreadUnarchive={onThreadUnarchive}
              onBulkArchive={onBulkArchive}
              onBulkUnarchive={onBulkUnarchive}
            />
          </TabsContent>

          <TabsContent value="images" className="space-y-4 py-4">
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-accent/10 rounded-full flex items-center justify-center">
                <ImageIcon size={32} className="text-accent" weight="fill" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Image Tools</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Create, edit, and enhance images with AI-powered tools
              </p>
              <div className="flex flex-col gap-3 max-w-sm mx-auto">
                <Button
                  onClick={() => {
                    setImageEditorMode("create")
                    setImageToEdit(undefined)
                    setImageEditorOpen(true)
                  }}
                  className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
                >
                  <ImageIcon size={18} weight="fill" />
                  Create New Image
                </Button>
                <Button
                  onClick={() => {
                    setImageEditorMode("edit")
                    setImageToEdit(undefined)
                    setImageEditorOpen(true)
                  }}
                  variant="outline"
                  className="border-accent/50 text-accent hover:bg-accent/10 gap-2"
                >
                  <ImageIcon size={18} weight="fill" />
                  Edit Image
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="text-to-image" className="py-4">
            <TextToImage onSaveToChat={onImageSaveToChat} />
          </TabsContent>

          <TabsContent value="stories" className="space-y-4 py-4">
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <BookOpen size={32} className="text-primary" weight="fill" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Story Creator</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Create detailed stories with AI assistance and save them to chat
              </p>
              <Button
                onClick={() => setStoryCreatorOpen(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
              >
                <BookOpen size={18} weight="fill" />
                Create New Story
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>

      <ImageEditor
        open={imageEditorOpen}
        onClose={() => setImageEditorOpen(false)}
        imageUrl={imageToEdit}
        mode={imageEditorMode}
        onSaveToChat={onImageSaveToChat}
      />

      <StoryCreator
        open={storyCreatorOpen}
        onClose={() => setStoryCreatorOpen(false)}
        onSaveToChat={onStorySaveToChat}
      />
    </Dialog>
  )
}

interface VoiceTabContentProps {
  currentUser: UserAccount
}

function VoiceTabContent({ currentUser }: VoiceTabContentProps) {
  const userKey = currentUser.id
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [voiceSettings, setVoiceSettings] = useKV<VoiceSettings>(`voice-settings-${userKey}`, {
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
  })
  const [customVoiceFiles, setCustomVoiceFiles] = useKV<CustomVoiceFile[]>(`custom-voice-files-${userKey}`, [])
  const [selectedVoiceFileId, setSelectedVoiceFileId] = useKV<string | null>(`selected-voice-file-${userKey}`, null)
  const [testText, setTestText] = useState("Hello, I am your AI assistant. This is how I sound.")
  const [isTesting, setIsTesting] = useState(false)
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null)
  const voiceFileInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const settings = voiceSettings || { rate: 1.0, pitch: 1.0, volume: 1.0 }
  const voiceFiles = customVoiceFiles || []

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices()
        setVoices(availableVoices)
      }

      loadVoices()
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
  }, [])

  const handleTestVoice = () => {
    if (!testText.trim()) return
    
    window.speechSynthesis.cancel()
    setIsTesting(true)

    const utterance = new SpeechSynthesisUtterance(testText)
    
    if (settings.voiceName) {
      const selectedVoice = voices.find((v) => v.name === settings.voiceName)
      if (selectedVoice) {
        utterance.voice = selectedVoice
      }
    }

    utterance.rate = settings.rate
    utterance.pitch = settings.pitch
    utterance.volume = settings.volume

    utterance.onend = () => {
      setIsTesting(false)
    }

    utterance.onerror = () => {
      setIsTesting(false)
      toast.error("Error testing voice")
    }

    window.speechSynthesis.speak(utterance)
  }

  const handleStopTest = () => {
    window.speechSynthesis.cancel()
    setIsTesting(false)
  }

  const handleResetToDefaults = () => {
    setVoiceSettings({
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
    })
    toast.success("Voice settings reset to defaults")
  }

  const handleVoiceFileUpload = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return

    const file = selectedFiles[0]
    const fileName = file.name.toLowerCase()
    
    const supportedExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac']
    const isSupported = supportedExtensions.some(ext => fileName.endsWith(ext))

    if (!isSupported) {
      toast.error("Unsupported audio format. Please upload MP3, WAV, OGG, M4A, or AAC files.")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Audio file must be less than 5MB")
      return
    }

    try {
      const reader = new FileReader()
      const audioDataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.onerror = () => reject(new Error("Failed to read file"))
        reader.readAsDataURL(file)
      })

      const audio = new Audio(audioDataUrl)
      const duration = await new Promise<number>((resolve) => {
        audio.onloadedmetadata = () => resolve(audio.duration)
        audio.onerror = () => resolve(0)
      })

      const newVoiceFile: CustomVoiceFile = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name: file.name,
        audioDataUrl,
        uploadedAt: Date.now(),
        duration: Math.round(duration),
      }

      setCustomVoiceFiles((current) => [...(current || []), newVoiceFile])
      toast.success(`${file.name} uploaded successfully`)
    } catch (error) {
      toast.error("Failed to upload voice file")
      console.error(error)
    }
  }

  const handleVoiceFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleVoiceFileUpload(e.target.files)
    if (voiceFileInputRef.current) {
      voiceFileInputRef.current.value = ""
    }
  }

  const handlePlayVoiceFile = (voiceFile: CustomVoiceFile) => {
    if (playingVoiceId === voiceFile.id) {
      audioRef.current?.pause()
      setPlayingVoiceId(null)
      return
    }

    if (audioRef.current) {
      audioRef.current.pause()
    }

    const audio = new Audio(voiceFile.audioDataUrl)
    audio.volume = settings.volume
    audioRef.current = audio

    audio.onended = () => {
      setPlayingVoiceId(null)
    }

    audio.onerror = () => {
      setPlayingVoiceId(null)
      toast.error("Failed to play audio file")
    }

    audio.play()
    setPlayingVoiceId(voiceFile.id)
  }

  const handleDeleteVoiceFile = (id: string) => {
    if (playingVoiceId === id) {
      audioRef.current?.pause()
      setPlayingVoiceId(null)
    }
    if (selectedVoiceFileId === id) {
      setSelectedVoiceFileId(null)
    }
    setCustomVoiceFiles((current) => (current || []).filter((f) => f.id !== id))
    toast.success("Voice file deleted")
  }

  const handleSelectVoiceFile = (id: string) => {
    setSelectedVoiceFileId(id)
    const voiceFile = voiceFiles.find(f => f.id === id)
    if (voiceFile) {
      toast.success(`Now using "${voiceFile.name}" as bot voice`)
    }
  }

  const handleDeselectVoiceFile = () => {
    setSelectedVoiceFileId(null)
    toast.success("Switched back to text-to-speech voice")
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const englishVoices = voices.filter((v) => v.lang.startsWith("en"))
  const otherVoices = voices.filter((v) => !v.lang.startsWith("en"))

  const getVoiceLabel = (voice: SpeechSynthesisVoice) => {
    const parts = [voice.name]
    if (voice.lang) parts.push(`(${voice.lang})`)
    if (voice.localService) parts.push("📍")
    return parts.join(" ")
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-accent/10 rounded-full flex items-center justify-center">
          <SpeakerHigh size={32} className="text-accent" weight="fill" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Voice Customization</h3>
        <p className="text-sm text-muted-foreground">
          Choose a voice and adjust settings for text-to-speech
        </p>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="voice-select">Select Voice</Label>
          <Select
            value={settings.voiceName || "default"}
            onValueChange={(value) => setVoiceSettings((prev) => ({ 
              ...(prev || { rate: 1.0, pitch: 1.0, volume: 1.0 }), 
              voiceName: value === "default" ? undefined : value 
            }))}
          >
            <SelectTrigger id="voice-select" className="w-full">
              <SelectValue placeholder="Default voice" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="default">Default (Auto-select)</SelectItem>
              {englishVoices.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    English Voices
                  </div>
                  {englishVoices.map((voice) => (
                    <SelectItem key={voice.name} value={voice.name}>
                      {getVoiceLabel(voice)}
                    </SelectItem>
                  ))}
                </>
              )}
              {otherVoices.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    Other Languages
                  </div>
                  {otherVoices.map((voice) => (
                    <SelectItem key={voice.name} value={voice.name}>
                      {getVoiceLabel(voice)}
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {voices.length === 0 ? "Loading voices..." : `${voices.length} voices available`}
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="rate-slider">Speed</Label>
              <span className="text-sm text-muted-foreground">{settings.rate.toFixed(1)}x</span>
            </div>
            <Slider
              id="rate-slider"
              min={0.5}
              max={2.0}
              step={0.1}
              value={[settings.rate]}
              onValueChange={([value]) => setVoiceSettings((prev) => ({ 
                ...(prev || { rate: 1.0, pitch: 1.0, volume: 1.0 }), 
                rate: value 
              }))}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">Adjust how fast the voice speaks</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="pitch-slider">Pitch</Label>
              <span className="text-sm text-muted-foreground">{settings.pitch.toFixed(1)}</span>
            </div>
            <Slider
              id="pitch-slider"
              min={0.5}
              max={2.0}
              step={0.1}
              value={[settings.pitch]}
              onValueChange={([value]) => setVoiceSettings((prev) => ({ 
                ...(prev || { rate: 1.0, pitch: 1.0, volume: 1.0 }), 
                pitch: value 
              }))}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">Adjust the voice pitch (higher or lower)</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="volume-slider">Volume</Label>
              <span className="text-sm text-muted-foreground">{Math.round(settings.volume * 100)}%</span>
            </div>
            <Slider
              id="volume-slider"
              min={0}
              max={1}
              step={0.1}
              value={[settings.volume]}
              onValueChange={([value]) => setVoiceSettings((prev) => ({ 
                ...(prev || { rate: 1.0, pitch: 1.0, volume: 1.0 }), 
                volume: value 
              }))}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">Adjust the playback volume</p>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="test-text">Test Text</Label>
          <Input
            id="test-text"
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            placeholder="Enter text to test voice..."
            className="text-[15px]"
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={isTesting ? handleStopTest : handleTestVoice}
            className={isTesting 
              ? "flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90" 
              : "flex-1 bg-accent text-accent-foreground hover:bg-accent/90"}
            disabled={!testText.trim()}
          >
            <SpeakerHigh size={18} weight="fill" className="mr-2" />
            {isTesting ? "Stop" : "Test Voice"}
          </Button>
          <Button
            onClick={handleResetToDefaults}
            variant="outline"
            className="border-muted-foreground/30"
          >
            Reset
          </Button>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <SpeakerHigh size={16} weight="fill" className="text-accent" />
            Voice Tips
          </h4>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>Different browsers provide different voices</li>
            <li>Voices marked with 📍 are installed locally</li>
            <li>Try adjusting speed and pitch to find your perfect voice</li>
            <li>Your settings are saved per account</li>
          </ul>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <MusicNote size={16} weight="fill" className="text-primary" />
                Custom Voice Files
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                Upload audio files to use as bot voice responses. Click "Use" to activate a voice.
              </p>
            </div>
            <Badge variant="secondary" className="text-xs">
              {voiceFiles.length}
            </Badge>
          </div>

          <input
            ref={voiceFileInputRef}
            type="file"
            className="hidden"
            accept="audio/mp3,audio/wav,audio/ogg,audio/m4a,audio/aac,.mp3,.wav,.ogg,.m4a,.aac"
            onChange={handleVoiceFileInputChange}
          />

          <Button
            onClick={() => voiceFileInputRef.current?.click()}
            variant="outline"
            className="w-full border-primary/50 text-primary hover:bg-primary/10"
          >
            <UploadSimple size={18} weight="fill" className="mr-2" />
            Upload Voice File
          </Button>

          {voiceFiles.length > 0 ? (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              <AnimatePresence>
                {voiceFiles.map((voiceFile) => {
                  const isSelected = selectedVoiceFileId === voiceFile.id
                  return (
                    <motion.div
                      key={voiceFile.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                      className={`flex items-center gap-3 p-3 rounded-lg group transition-all ${
                        isSelected 
                          ? "bg-accent/20 border-2 border-accent" 
                          : "bg-muted/50 hover:bg-muted/70 border-2 border-transparent"
                      }`}
                    >
                      <div className={isSelected ? "text-accent" : "text-primary"}>
                        <MusicNote size={20} weight="fill" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{voiceFile.name}</p>
                          {isSelected && (
                            <Badge variant="secondary" className="text-xs bg-accent/20 text-accent border-accent">
                              Active
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {voiceFile.duration ? formatDuration(voiceFile.duration) : "Unknown"} · {new Date(voiceFile.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant={isSelected ? "default" : "outline"}
                        className={isSelected 
                          ? "bg-accent text-accent-foreground hover:bg-accent/90" 
                          : "border-accent/50 text-accent hover:bg-accent/10"}
                        onClick={() => isSelected ? handleDeselectVoiceFile() : handleSelectVoiceFile(voiceFile.id)}
                      >
                        {isSelected ? "Deselect" : "Use"}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 hover:bg-accent/20"
                        onClick={() => handlePlayVoiceFile(voiceFile)}
                        title={playingVoiceId === voiceFile.id ? "Stop" : "Play"}
                      >
                        {playingVoiceId === voiceFile.id ? (
                          <Pause size={16} weight="fill" className="text-accent" />
                        ) : (
                          <Play size={16} weight="fill" className="text-accent" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20"
                        onClick={() => handleDeleteVoiceFile(voiceFile.id)}
                        title="Delete"
                      >
                        <Trash size={16} weight="fill" className="text-destructive" />
                      </Button>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-6 border-2 border-dashed border-border rounded-lg">
              <MusicNote size={32} className="mx-auto mb-2 text-muted-foreground" weight="duotone" />
              <p className="text-sm text-muted-foreground">
                No custom voice files uploaded yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports MP3, WAV, OGG, M4A, AAC (max 5MB)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface ConversationsTabContentProps {
  threads: ConversationThread[]
  currentThreadId: string
  onThreadSelect: (threadId: string) => void
  onThreadCreate: (title: string) => void
  onThreadDelete: (threadId: string) => void
  onThreadRename: (threadId: string, newTitle: string) => void
  onThreadArchive: (threadId: string) => void
  onThreadUnarchive: (threadId: string) => void
  onBulkArchive: (threadIds: string[]) => void
  onBulkUnarchive: (threadIds: string[]) => void
}

function ConversationsTabContent({
  threads,
  currentThreadId,
  onThreadSelect,
  onThreadCreate,
  onThreadDelete,
  onThreadRename,
  onThreadArchive,
  onThreadUnarchive,
  onBulkArchive,
  onBulkUnarchive,
}: ConversationsTabContentProps) {
  const [newThreadTitle, setNewThreadTitle] = useState("")
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState("")
  const [showArchived, setShowArchived] = useState(false)
  const [selectedThreads, setSelectedThreads] = useState<string[]>([])

  const activeThreads = threads.filter(t => !t.archived)
  const archivedThreads = threads.filter(t => t.archived)
  const displayThreads = showArchived ? archivedThreads : activeThreads

  const handleCreateThread = () => {
    if (!newThreadTitle.trim()) {
      toast.error("Thread title cannot be empty")
      return
    }
    onThreadCreate(newThreadTitle.trim())
    setNewThreadTitle("")
  }

  const handleRenameThread = (threadId: string) => {
    if (!editingTitle.trim()) {
      toast.error("Thread title cannot be empty")
      return
    }
    onThreadRename(threadId, editingTitle.trim())
    setEditingThreadId(null)
    setEditingTitle("")
  }

  const toggleThreadSelection = (threadId: string) => {
    setSelectedThreads(current =>
      current.includes(threadId)
        ? current.filter(id => id !== threadId)
        : [...current, threadId]
    )
  }

  const handleBulkAction = () => {
    if (selectedThreads.length === 0) return
    
    if (showArchived) {
      onBulkUnarchive(selectedThreads)
      toast.success(`${selectedThreads.length} conversation${selectedThreads.length > 1 ? 's' : ''} restored`)
    } else {
      onBulkArchive(selectedThreads)
      toast.success(`${selectedThreads.length} conversation${selectedThreads.length > 1 ? 's' : ''} archived`)
    }
    setSelectedThreads([])
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Label>Create New Conversation</Label>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter conversation title..."
            value={newThreadTitle}
            onChange={(e) => setNewThreadTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleCreateThread()
              }
            }}
            className="text-[15px]"
          />
          <Button
            onClick={handleCreateThread}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Chat size={18} weight="fill" />
          </Button>
        </div>
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <Label>
          {showArchived ? "Archived Conversations" : "Active Conversations"}
          <Badge variant="secondary" className="ml-2 text-xs">
            {displayThreads.length}
          </Badge>
        </Label>
        <div className="flex items-center gap-2">
          {selectedThreads.length > 0 && (
            <Button
              onClick={handleBulkAction}
              size="sm"
              variant="outline"
              className="border-accent/50 text-accent hover:bg-accent/10"
            >
              {showArchived ? "Restore" : "Archive"} ({selectedThreads.length})
            </Button>
          )}
          <Button
            onClick={() => {
              setShowArchived(!showArchived)
              setSelectedThreads([])
            }}
            size="sm"
            variant="outline"
          >
            {showArchived ? "Show Active" : "Show Archived"}
          </Button>
        </div>
      </div>

      {displayThreads.length > 0 ? (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          <AnimatePresence>
            {displayThreads.map((thread) => (
              <motion.div
                key={thread.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.25 }}
                className={`flex items-center gap-3 p-3 rounded-lg group transition-colors ${
                  thread.id === currentThreadId
                    ? "bg-accent/20 border-2 border-accent"
                    : "bg-muted/50 hover:bg-muted/70 border-2 border-transparent"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedThreads.includes(thread.id)}
                  onChange={() => toggleThreadSelection(thread.id)}
                  className="cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="text-accent">
                  <Chat size={16} weight="fill" />
                </div>
                <div className="flex-1 min-w-0">
                  {editingThreadId === thread.id ? (
                    <Input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleRenameThread(thread.id)
                        } else if (e.key === "Escape") {
                          setEditingThreadId(null)
                          setEditingTitle("")
                        }
                      }}
                      onBlur={() => handleRenameThread(thread.id)}
                      className="text-sm h-7"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <p className="text-sm font-medium truncate">{thread.title}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {thread.messageCount} messages · {new Date(thread.lastUpdatedAt).toLocaleDateString()}
                  </p>
                </div>
                {!showArchived && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      onThreadSelect(thread.id)
                      toast.success(`Switched to "${thread.title}"`)
                    }}
                  >
                    Open
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditingThreadId(thread.id)
                    setEditingTitle(thread.title)
                  }}
                >
                  Rename
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (showArchived) {
                      onThreadUnarchive(thread.id)
                    } else {
                      onThreadArchive(thread.id)
                    }
                  }}
                >
                  {showArchived ? "Restore" : "Archive"}
                </Button>
                {showArchived && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(`Delete "${thread.title}" permanently?`)) {
                        onThreadDelete(thread.id)
                      }
                    }}
                  >
                    <X size={16} />
                  </Button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            {showArchived ? "No archived conversations" : "No active conversations"}
          </p>
        </div>
      )}
    </div>
  )
}

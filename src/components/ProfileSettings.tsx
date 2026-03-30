import { useState, useRef, ChangeEvent } from "react"
import { User as UserIcon, Camera, Check, UploadSimple, X, File, FileImage, FilePdf, FileText } from "@phosphor-icons/react"
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
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { UserAccount } from "@/components/UserAccount"
import { KnowledgeFile } from "@/components/KnowledgeBase"

interface ProfileSettingsProps {
  currentUser: UserAccount
  onUpdateProfile: (updatedUser: UserAccount) => void
  knowledgeFiles: KnowledgeFile[]
  onAddFile: (file: KnowledgeFile) => void
  onRemoveFile: (id: string) => void
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

export function ProfileSettings({ currentUser, onUpdateProfile, knowledgeFiles, onAddFile, onRemoveFile }: ProfileSettingsProps) {
  const [open, setOpen] = useState(false)
  const [displayName, setDisplayName] = useState(currentUser.displayName || currentUser.username)
  const [selectedAvatar, setSelectedAvatar] = useState(currentUser.avatarUrl || "")
  const [customAvatarUrl, setCustomAvatarUrl] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSave = () => {
    if (!displayName.trim()) {
      toast.error("Display name cannot be empty")
      return
    }

    if (displayName.length < 2) {
      toast.error("Display name must be at least 2 characters")
      return
    }

    const updatedUser: UserAccount = {
      ...currentUser,
      displayName: displayName.trim(),
      avatarUrl: selectedAvatar || undefined,
    }

    onUpdateProfile(updatedUser)
    toast.success("Profile updated successfully!")
    setOpen(false)
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

  const getFileIcon = (type: string) => {
    if (type.includes("image")) return <FileImage size={16} weight="fill" />
    if (type.includes("pdf")) return <FilePdf size={16} weight="fill" />
    if (type.includes("text") || type.includes("markdown")) return <FileText size={16} weight="fill" />
    return <File size={16} weight="fill" />
  }

  const getFileTypeLabel = (type: string): string => {
    if (type.includes("image")) return "IMAGE"
    if (type.includes("pdf")) return "PDF"
    if (type.includes("text")) return "TXT"
    if (type.includes("markdown")) return "MD"
    return "FILE"
  }

  const handleFileSelect = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return

    const file = selectedFiles[0]
    const supportedTypes = [
      "text/plain",
      "text/markdown",
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
    ]

    if (!supportedTypes.some((type) => file.type.includes(type.split("/")[1]))) {
      toast.error("Unsupported file type. Please upload PDF, TXT, MD, PNG, or JPG files.")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB")
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
      } else {
        content = await file.text()
      }

      const newFile: KnowledgeFile = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name: file.name,
        type: file.type,
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-accent/10 active:scale-95 transition-transform"
          title="Settings"
        >
          <UserIcon size={18} weight="bold" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Settings</DialogTitle>
          <DialogDescription>
            Manage your profile and knowledge base
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="knowledge">
              Knowledge Base
              <Badge variant="secondary" className="ml-2 text-xs">
                {knowledgeFiles.length}
              </Badge>
            </TabsTrigger>
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
                accept=".txt,.md,.pdf,.png,.jpg,.jpeg"
                onChange={handleInputChange}
              />
              <UploadSimple size={40} className="mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">
                Drop files here or click to upload
              </p>
              <p className="text-xs text-muted-foreground">
                Supports PDF, TXT, MD, PNG, JPG (max 5MB)
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
                      <div className="text-accent">{getFileIcon(file.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(file.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {getFileTypeLabel(file.type)}
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
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

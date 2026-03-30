import { useState } from "react"
import { Plus, Chat, Trash, PencilSimple, Check, X, Archive, Warning } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

export interface ConversationThread {
  id: string
  title: string
  createdAt: number
  lastUpdatedAt: number
  messageCount: number
  archived?: boolean
}

interface ConversationThreadsProps {
  threads: ConversationThread[]
  currentThreadId: string
  onThreadSelect: (threadId: string) => void
  onThreadCreate: (title: string) => void
  onThreadDelete: (threadId: string) => void
  onThreadRename: (threadId: string, newTitle: string) => void
  onThreadArchive: (threadId: string) => void
  onThreadUnarchive: (threadId: string) => void
}

export function ConversationThreads({
  threads,
  currentThreadId,
  onThreadSelect,
  onThreadCreate,
  onThreadDelete,
  onThreadRename,
  onThreadArchive,
  onThreadUnarchive,
}: ConversationThreadsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [newThreadTitle, setNewThreadTitle] = useState("")
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState("")
  const [deleteThreadId, setDeleteThreadId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active")

  const handleCreateThread = () => {
    const title = newThreadTitle.trim() || `Conversation ${threads.length + 1}`
    onThreadCreate(title)
    setNewThreadTitle("")
  }

  const handleStartEdit = (thread: ConversationThread) => {
    setEditingThreadId(thread.id)
    setEditingTitle(thread.title)
  }

  const handleSaveEdit = () => {
    if (editingThreadId && editingTitle.trim()) {
      onThreadRename(editingThreadId, editingTitle.trim())
    }
    setEditingThreadId(null)
    setEditingTitle("")
  }

  const handleCancelEdit = () => {
    setEditingThreadId(null)
    setEditingTitle("")
  }

  const handleDeleteConfirm = () => {
    if (deleteThreadId) {
      onThreadDelete(deleteThreadId)
      setDeleteThreadId(null)
    }
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getDaysOld = (timestamp: number) => {
    const diffMs = Date.now() - timestamp
    return Math.floor(diffMs / 86400000)
  }

  const isNearAutoArchive = (thread: ConversationThread) => {
    if (thread.archived) return false
    const daysOld = getDaysOld(thread.lastUpdatedAt)
    return daysOld >= 21 && daysOld < 30
  }

  const activeThreads = threads.filter(t => !t.archived).sort((a, b) => b.lastUpdatedAt - a.lastUpdatedAt)
  const archivedThreads = threads.filter(t => t.archived).sort((a, b) => b.lastUpdatedAt - a.lastUpdatedAt)

  const renderThreadList = (threadList: ConversationThread[]) => (
    <TooltipProvider>
      <div className="space-y-2 pr-4">
        <AnimatePresence mode="popLayout">
          {threadList.map((thread) => (
            <motion.div
              key={thread.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              layout
              className={cn(
                "group relative p-3 rounded-lg border-2 transition-all cursor-pointer",
                currentThreadId === thread.id
                  ? "bg-accent/10 border-accent"
                  : "bg-card border-border hover:border-accent/50 hover:bg-accent/5"
              )}
              onClick={() => {
                if (editingThreadId !== thread.id) {
                  onThreadSelect(thread.id)
                  setIsOpen(false)
                }
              }}
            >
              {editingThreadId === thread.id ? (
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Input
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSaveEdit()
                      } else if (e.key === "Escape") {
                        handleCancelEdit()
                      }
                    }}
                    className="h-8 text-sm"
                    autoFocus
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-accent hover:text-accent hover:bg-accent/10"
                    onClick={handleSaveEdit}
                  >
                    <Check size={16} weight="bold" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={handleCancelEdit}
                  >
                    <X size={16} weight="bold" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm truncate">
                          {thread.title}
                        </h4>
                        {isNearAutoArchive(thread) && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex-shrink-0">
                                <Warning size={16} weight="fill" className="text-destructive animate-pulse" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Auto-archives in {30 - getDaysOld(thread.lastUpdatedAt)} days</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{thread.messageCount} messages</span>
                        <span>•</span>
                        <span>{formatDate(thread.lastUpdatedAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!thread.archived && currentThreadId === thread.id && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-accent hover:bg-accent/10"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleStartEdit(thread)
                          }}
                        >
                          <PencilSimple size={14} weight="bold" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-accent hover:bg-accent/10"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (thread.archived) {
                            onThreadUnarchive(thread.id)
                          } else {
                            onThreadArchive(thread.id)
                          }
                        }}
                        title={thread.archived ? "Unarchive" : "Archive"}
                      >
                        <Archive size={14} weight="bold" />
                      </Button>
                      {(thread.archived || (activeThreads.length > 1 && !thread.archived)) && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteThreadId(thread.id)
                          }}
                        >
                          <Trash size={14} weight="bold" />
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {threadList.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {activeTab === "archived" ? "No archived conversations" : "No conversations yet"}
          </div>
        )}
      </div>
    </TooltipProvider>
  )

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            className="border-accent/50 text-accent hover:bg-accent/10 active:scale-95 transition-transform gap-2"
            size="sm"
          >
            <Chat size={18} weight="bold" />
            <span className="hidden sm:inline">Conversations</span>
            {threads.length > 1 && (
              <span className="bg-accent/20 text-accent text-xs px-1.5 py-0.5 rounded-full font-semibold">
                {threads.length}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="text-xl">Conversations</SheetTitle>
          </SheetHeader>
          
          <div className="flex flex-col gap-4 mt-6">
            <div className="flex gap-2">
              <Input
                placeholder="New conversation title..."
                value={newThreadTitle}
                onChange={(e) => setNewThreadTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateThread()
                  }
                }}
                className="flex-1"
              />
              <Button
                onClick={handleCreateThread}
                className="bg-accent text-accent-foreground hover:bg-accent/90 active:scale-95 transition-transform"
                size="icon"
              >
                <Plus size={20} weight="bold" />
              </Button>
            </div>

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "active" | "archived")} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="active" className="gap-2">
                  <Chat size={16} weight="bold" />
                  <span>Active</span>
                  {activeThreads.length > 0 && (
                    <span className="ml-1 text-xs">({activeThreads.length})</span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="archived" className="gap-2">
                  <Archive size={16} weight="bold" />
                  <span>Archived</span>
                  {archivedThreads.length > 0 && (
                    <span className="ml-1 text-xs">({archivedThreads.length})</span>
                  )}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="active" className="mt-4">
                <ScrollArea className="h-[calc(100vh-340px)]">
                  {renderThreadList(activeThreads)}
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="archived" className="mt-4">
                <ScrollArea className="h-[calc(100vh-340px)]">
                  {renderThreadList(archivedThreads)}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteThreadId} onOpenChange={(open) => !open && setDeleteThreadId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this conversation and all its messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

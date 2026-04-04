import { useState } from "react"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Plus, FloppyDisk, Trash, Pencil, X, MagicWand, Sparkle } from "@phosphor-icons/react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

interface TemplateEditorProps {
  open: boolean
  onClose: () => void
  onSelectTemplate?: (template: CustomTemplate) => void
}

export interface CustomTemplate {
  id: string
  name: string
  genre: string
  tone: string
  description: string
  emoji: string
  isCustom: boolean
  createdAt: number
  lastEditedAt?: number
}

const availableEmojis = [
  "🐉", "🕵️", "🚀", "💕", "🧠", "🏰", "🎪", "⚔️", "✨", "😈",
  "🌙", "💻", "🔮", "👑", "🌟", "🎭", "🦄", "🌊", "🔥", "❄️",
  "🌈", "💀", "🗡️", "🛸", "🎨", "📚", "🎵", "🌹", "⚡", "🌺",
  "🦋", "🐺", "🌲", "🏔️", "🌴", "🎃", "🦅", "🌸", "💎", "🎯"
]

export function TemplateEditor({ open, onClose, onSelectTemplate }: TemplateEditorProps) {
  const [customTemplates, setCustomTemplates] = useLocalStorage<CustomTemplate[]>("custom-story-templates", [])
  const [isCreating, setIsCreating] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<CustomTemplate | null>(null)
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null)
  
  const [name, setName] = useState("")
  const [genre, setGenre] = useState("fantasy")
  const [tone, setTone] = useState("adventurous")
  const [description, setDescription] = useState("")
  const [emoji, setEmoji] = useState("✨")

  const genres = [
    "fantasy", "sci-fi", "mystery", "romance", "thriller", 
    "horror", "adventure", "historical", "contemporary", "comedy"
  ]

  const tones = [
    "adventurous", "dark", "lighthearted", "dramatic", "humorous",
    "mysterious", "inspirational", "melancholic", "suspenseful", "whimsical"
  ]

  const sortedTemplates = [...(customTemplates || [])].sort((a, b) => 
    (b.lastEditedAt || b.createdAt) - (a.lastEditedAt || a.createdAt)
  )

  const resetForm = () => {
    setName("")
    setGenre("fantasy")
    setTone("adventurous")
    setDescription("")
    setEmoji("✨")
    setEditingTemplate(null)
  }

  const handleStartCreate = () => {
    resetForm()
    setIsCreating(true)
  }

  const handleStartEdit = (template: CustomTemplate) => {
    setName(template.name)
    setGenre(template.genre)
    setTone(template.tone)
    setDescription(template.description)
    setEmoji(template.emoji)
    setEditingTemplate(template)
    setIsCreating(true)
  }

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Please enter a template name")
      return
    }

    if (!description.trim()) {
      toast.error("Please enter a template description")
      return
    }

    const now = Date.now()

    if (editingTemplate) {
      const updated: CustomTemplate = {
        ...editingTemplate,
        name: name.trim(),
        genre,
        tone,
        description: description.trim(),
        emoji,
        lastEditedAt: now
      }

      setCustomTemplates((current) => 
        (current || []).map(t => t.id === editingTemplate.id ? updated : t)
      )

      toast.success("Template updated successfully!")
    } else {
      const newTemplate: CustomTemplate = {
        id: `custom-template-${now}`,
        name: name.trim(),
        genre,
        tone,
        description: description.trim(),
        emoji,
        isCustom: true,
        createdAt: now
      }

      setCustomTemplates((current) => [...(current || []), newTemplate])
      toast.success("Template created successfully!")
    }

    setIsCreating(false)
    resetForm()
  }

  const handleDelete = (templateId: string) => {
    const template = (customTemplates || []).find(t => t.id === templateId)
    
    setCustomTemplates((current) => 
      (current || []).filter(t => t.id !== templateId)
    )

    toast.success(`"${template?.name}" deleted`)
    setTemplateToDelete(null)
  }

  const handleUseTemplate = (template: CustomTemplate) => {
    if (onSelectTemplate) {
      onSelectTemplate(template)
      onClose()
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl h-[85vh] p-0 flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl flex items-center gap-2">
                  <MagicWand size={28} weight="fill" className="text-accent" />
                  Template Editor
                </DialogTitle>
                <DialogDescription>
                  Create and manage your custom story templates
                </DialogDescription>
              </div>
              {!isCreating && (
                <Button
                  onClick={handleStartCreate}
                  className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
                  size="sm"
                >
                  <Plus size={16} weight="bold" />
                  New Template
                </Button>
              )}
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 px-6">
            <div className="py-6">
              {isCreating ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <Card className="border-accent/30 bg-gradient-to-br from-accent/5 to-primary/5">
                    <CardHeader>
                      <CardTitle className="text-base">
                        {editingTemplate ? "Edit Template" : "Create New Template"}
                      </CardTitle>
                      <CardDescription>
                        {editingTemplate ? "Update your template details" : "Fill in the details for your custom template"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="template-name">Template Name *</Label>
                        <Input
                          id="template-name"
                          placeholder="e.g., Epic Space Adventure"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="template-desc">Description *</Label>
                        <Textarea
                          id="template-desc"
                          placeholder="Describe what makes this template unique..."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Genre</Label>
                          <Select value={genre} onValueChange={setGenre}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {genres.map((g) => (
                                <SelectItem key={g} value={g}>
                                  {g.charAt(0).toUpperCase() + g.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Tone</Label>
                          <Select value={tone} onValueChange={setTone}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {tones.map((t) => (
                                <SelectItem key={t} value={t}>
                                  {t.charAt(0).toUpperCase() + t.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Template Icon</Label>
                        <div className="grid grid-cols-10 gap-2">
                          {availableEmojis.map((e) => (
                            <button
                              key={e}
                              onClick={() => setEmoji(e)}
                              className={`
                                text-2xl p-2 rounded-lg border-2 transition-all hover:scale-110 active:scale-95
                                ${emoji === e 
                                  ? 'border-accent bg-accent/10' 
                                  : 'border-border hover:border-accent/50'
                                }
                              `}
                            >
                              {e}
                            </button>
                          ))}
                        </div>
                      </div>

                      <Card className="border-accent/50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Preview</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card">
                            <span className="text-2xl flex-shrink-0">{emoji}</span>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm mb-1">
                                {name || "Template Name"}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {description || "Template description will appear here"}
                              </p>
                              <div className="flex gap-1.5 mt-2">
                                <Badge variant="secondary" className="text-xs">
                                  {genre}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {tone}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </CardContent>
                  </Card>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setIsCreating(false)
                        resetForm()
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
                      disabled={!name.trim() || !description.trim()}
                    >
                      <FloppyDisk size={18} weight="fill" />
                      {editingTemplate ? "Update Template" : "Create Template"}
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {sortedTemplates && sortedTemplates.length > 0 ? (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">
                          {sortedTemplates.length} custom {sortedTemplates.length === 1 ? "template" : "templates"}
                        </p>
                      </div>
                      <AnimatePresence>
                        {sortedTemplates.map((template, index) => (
                          <motion.div
                            key={template.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <Card className="group hover:border-accent/50 transition-colors">
                              <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                  <span className="text-3xl flex-shrink-0 mt-1">
                                    {template.emoji}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-base mb-1 truncate">
                                          {template.name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                          {template.description}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                          <Badge variant="secondary" className="text-xs">
                                            {template.genre}
                                          </Badge>
                                          <Badge variant="outline" className="text-xs">
                                            {template.tone}
                                          </Badge>
                                          {template.lastEditedAt && (
                                            <Badge variant="outline" className="text-xs">
                                              Edited {new Date(template.lastEditedAt).toLocaleDateString()}
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                          onClick={() => handleUseTemplate(template)}
                                          variant="ghost"
                                          size="sm"
                                          className="gap-1 text-accent hover:text-accent hover:bg-accent/10"
                                          title="Use template"
                                        >
                                          <Sparkle size={14} weight="fill" />
                                          Use
                                        </Button>
                                        <Button
                                          onClick={() => handleStartEdit(template)}
                                          variant="ghost"
                                          size="sm"
                                          className="gap-1"
                                          title="Edit template"
                                        >
                                          <Pencil size={14} weight="fill" />
                                        </Button>
                                        <Button
                                          onClick={() => setTemplateToDelete(template.id)}
                                          variant="ghost"
                                          size="sm"
                                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                          title="Delete template"
                                        >
                                          <Trash size={14} weight="fill" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 bg-muted/30 rounded-full flex items-center justify-center">
                        <MagicWand size={32} className="text-muted-foreground" weight="fill" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">No custom templates yet</h3>
                      <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-4">
                        Create your own story templates with custom genre and tone combinations for quick access.
                      </p>
                      <Button
                        onClick={handleStartCreate}
                        className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
                      >
                        <Plus size={16} weight="bold" />
                        Create Your First Template
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!templateToDelete} onOpenChange={() => setTemplateToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{(customTemplates || []).find(t => t.id === templateToDelete)?.name}". 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => templateToDelete && handleDelete(templateToDelete)}
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

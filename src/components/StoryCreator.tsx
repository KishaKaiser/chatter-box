import { useState, useEffect, useRef } from "react"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Sparkle, BookOpen, DownloadSimple, Plus, X, ArrowCounterClockwise, FloppyDisk, FolderOpen, Trash, MagicWand, Play, Pause, Stop, SpeakerHigh } from "@phosphor-icons/react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { TemplateEditor, CustomTemplate } from "@/components/TemplateEditor"
import { useTextToSpeech } from "@/hooks/use-text-to-speech"

interface StoryCreatorProps {
  open: boolean
  onClose: () => void
  onSaveToChat?: (storyText: string) => void
}

interface StoryChapter {
  id: string
  number: number
  title: string
  content: string
}

interface Story {
  id?: string
  title: string
  genre: string
  tone: string
  length: string
  chapters: StoryChapter[]
  description: string
  mainCharacter?: string
  setting?: string
  conflict?: string
  additionalNotes?: string
  savedAt?: number
  lastEditedAt?: number
}

interface SavedStory {
  id: string
  title: string
  genre: string
  savedAt: number
  lastEditedAt: number
  chapterCount: number
}

export function StoryCreator({ open, onClose, onSaveToChat }: StoryCreatorProps) {
  const [currentTab, setCurrentTab] = useState<"setup" | "generate" | "view" | "saved">("saved")
  const [isGenerating, setIsGenerating] = useState(false)
  const [story, setStory] = useState<Story | null>(null)
  const [savedStories, setSavedStories] = useLocalStorage<Story[]>("saved-stories", [])
  const [storyToDelete, setStoryToDelete] = useState<string | null>(null)
  const [editingChapter, setEditingChapter] = useState<number | null>(null)
  const [editedContent, setEditedContent] = useState("")
  const [templateEditorOpen, setTemplateEditorOpen] = useState(false)
  const [customTemplates, setCustomTemplates] = useLocalStorage<CustomTemplate[]>("custom-story-templates", [])
  
  const [storyTitle, setStoryTitle] = useState("")
  const [storyDescription, setStoryDescription] = useState("")
  const [genre, setGenre] = useState("fantasy")
  const [tone, setTone] = useState("adventurous")
  const [length, setLength] = useState("medium")
  const [numChapters, setNumChapters] = useState("5")
  const [mainCharacter, setMainCharacter] = useState("")
  const [setting, setSetting] = useState("")
  const [conflict, setConflict] = useState("")
  const [additionalNotes, setAdditionalNotes] = useState("")
  
  const [narratingChapter, setNarratingChapter] = useState<number | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [selectedVoice, setSelectedVoice] = useLocalStorage<string>("narration-voice", "")
  const [narrationRate, setNarrationRate] = useLocalStorage<number>("narration-rate", 1.0)
  const [narrationPitch, setNarrationPitch] = useLocalStorage<number>("narration-pitch", 1.0)
  const [voiceSettingsOpen, setVoiceSettingsOpen] = useState(false)
  
  const { isSpeaking, isSupported, voices, speak, stop } = useTextToSpeech({
    voiceName: selectedVoice || undefined,
    rate: narrationRate || 1.0,
    pitch: narrationPitch || 1.0,
    volume: 1.0
  })
  
  useEffect(() => {
    if (!isSpeaking && narratingChapter !== null) {
      setNarratingChapter(null)
      setIsPaused(false)
    }
  }, [isSpeaking, narratingChapter])
  
  const handleNarrateChapter = (chapterNumber: number) => {
    if (!story || !isSupported) {
      if (!isSupported) {
        toast.error("Text-to-speech is not supported in your browser")
      }
      return
    }
    
    const chapter = story.chapters.find(ch => ch.number === chapterNumber)
    if (!chapter) return
    
    const textToSpeak = `Chapter ${chapter.number}: ${chapter.title}. ${chapter.content}`
    
    setNarratingChapter(chapterNumber)
    setIsPaused(false)
    speak(textToSpeak, {
      voiceName: selectedVoice || undefined,
      rate: narrationRate || 1.0,
      pitch: narrationPitch || 1.0,
      volume: 1.0
    })
    toast.success("Narration started")
  }
  
  const handleStopNarration = () => {
    stop()
    setNarratingChapter(null)
    setIsPaused(false)
    toast.info("Narration stopped")
  }

  const sortedSavedStories = [...(savedStories || [])].sort((a, b) => 
    (b.lastEditedAt || b.savedAt || 0) - (a.lastEditedAt || a.savedAt || 0)
  )

  const genres = [
    "fantasy", "sci-fi", "mystery", "romance", "thriller", 
    "horror", "adventure", "historical", "contemporary", "comedy"
  ]

  const tones = [
    "adventurous", "dark", "lighthearted", "dramatic", "humorous",
    "mysterious", "inspirational", "melancholic", "suspenseful", "whimsical"
  ]

  const lengths = [
    { value: "short", label: "Short (~500 words/chapter)" },
    { value: "medium", label: "Medium (~1000 words/chapter)" },
    { value: "long", label: "Long (~1500 words/chapter)" }
  ]

  const templates = [
    {
      id: "epic-fantasy",
      name: "Epic Fantasy Quest",
      genre: "fantasy",
      tone: "adventurous",
      description: "A hero's journey through magical realms filled with mythical creatures and ancient prophecies",
      emoji: "🐉"
    },
    {
      id: "noir-mystery",
      name: "Noir Detective",
      genre: "mystery",
      tone: "dark",
      description: "A gritty detective story set in rain-soaked streets where shadows hide deadly secrets",
      emoji: "🕵️"
    },
    {
      id: "space-opera",
      name: "Space Opera",
      genre: "sci-fi",
      tone: "dramatic",
      description: "An interstellar saga of warring factions, alien civilizations, and cosmic destiny",
      emoji: "🚀"
    },
    {
      id: "romantic-comedy",
      name: "Romantic Comedy",
      genre: "romance",
      tone: "lighthearted",
      description: "A heartwarming tale of love, laughter, and unexpected connections",
      emoji: "💕"
    },
    {
      id: "psychological-thriller",
      name: "Psychological Thriller",
      genre: "thriller",
      tone: "suspenseful",
      description: "A mind-bending journey where reality blurs and nothing is as it seems",
      emoji: "🧠"
    },
    {
      id: "gothic-horror",
      name: "Gothic Horror",
      genre: "horror",
      tone: "mysterious",
      description: "A chilling tale of ancient curses, haunted mansions, and things that lurk in the dark",
      emoji: "🏰"
    },
    {
      id: "whimsical-adventure",
      name: "Whimsical Adventure",
      genre: "adventure",
      tone: "whimsical",
      description: "A delightfully quirky journey filled with peculiar characters and enchanting surprises",
      emoji: "🎪"
    },
    {
      id: "historical-drama",
      name: "Historical Drama",
      genre: "historical",
      tone: "dramatic",
      description: "An epic period piece exploring pivotal moments and human struggles through time",
      emoji: "⚔️"
    },
    {
      id: "uplifting-inspiration",
      name: "Uplifting Journey",
      genre: "contemporary",
      tone: "inspirational",
      description: "An inspiring story of personal growth, resilience, and triumph over adversity",
      emoji: "✨"
    },
    {
      id: "dark-comedy",
      name: "Dark Comedy",
      genre: "comedy",
      tone: "humorous",
      description: "A wickedly funny tale that finds humor in the absurdity of life's darker moments",
      emoji: "😈"
    },
    {
      id: "melancholic-romance",
      name: "Bittersweet Romance",
      genre: "romance",
      tone: "melancholic",
      description: "A poignant love story exploring the beauty and pain of deep emotional connections",
      emoji: "🌙"
    },
    {
      id: "cyber-thriller",
      name: "Cyberpunk Thriller",
      genre: "sci-fi",
      tone: "suspenseful",
      description: "A high-tech noir set in neon-lit streets where hackers battle mega-corporations",
      emoji: "💻"
    }
  ]

  const allTemplates = [
    ...templates,
    ...(customTemplates || []).map(ct => ({
      id: ct.id,
      name: ct.name,
      genre: ct.genre,
      tone: ct.tone,
      description: ct.description,
      emoji: ct.emoji
    }))
  ]

  const applyTemplate = (templateId: string) => {
    const template = allTemplates.find(t => t.id === templateId)
    if (!template) return

    setGenre(template.genre)
    setTone(template.tone)
    setStoryDescription(template.description)
    toast.success(`Applied "${template.name}" template`)
  }

  const handleSelectCustomTemplate = (template: CustomTemplate) => {
    setGenre(template.genre)
    setTone(template.tone)
    setStoryDescription(template.description)
    toast.success(`Applied "${template.name}" template`)
  }

  const handleGenerate = async () => {
    if (!storyTitle.trim()) {
      toast.error("Please enter a story title")
      return
    }

    if (!storyDescription.trim()) {
      toast.error("Please enter a story description")
      return
    }

    setIsGenerating(true)
    
    try {
      const chaptersCount = parseInt(numChapters)
      const lengthDesc = lengths.find(l => l.value === length)?.label || "Medium length"
      
      const promptText = `You are a creative fiction writer. Generate a detailed story with the following specifications:

Title: ${storyTitle}
Description: ${storyDescription}
Genre: ${genre}
Tone: ${tone}
Length per chapter: ${lengthDesc}
Number of chapters: ${chaptersCount}
${mainCharacter ? `Main Character: ${mainCharacter}` : ''}
${setting ? `Setting: ${setting}` : ''}
${conflict ? `Central Conflict: ${conflict}` : ''}
${additionalNotes ? `Additional Notes: ${additionalNotes}` : ''}

Create a complete story with ${chaptersCount} chapters. Each chapter should:
- Have a compelling title
- Be well-structured with beginning, middle, and end
- Advance the plot meaningfully
- Include vivid descriptions and engaging dialogue
- Match the specified tone and genre

Return the response as a JSON object with this structure:
{
  "chapters": [
    {
      "number": 1,
      "title": "Chapter Title",
      "content": "Full chapter content with multiple paragraphs..."
    }
  ]
}

Make the story engaging, creative, and complete. Each chapter should be substantial and well-written.`

      const response = await window.spark.llm(promptText, "gpt-4o", true)
      const parsed = JSON.parse(response)
      
      const storyId = story?.id || `story-${Date.now()}`
      const now = Date.now()
      
      const generatedStory: Story = {
        id: storyId,
        title: storyTitle,
        genre,
        tone,
        length,
        description: storyDescription,
        mainCharacter: mainCharacter || undefined,
        setting: setting || undefined,
        conflict: conflict || undefined,
        additionalNotes: additionalNotes || undefined,
        chapters: parsed.chapters.map((ch: any) => ({
          id: `chapter-${ch.number}`,
          number: ch.number,
          title: ch.title,
          content: ch.content
        })),
        savedAt: story?.savedAt || now,
        lastEditedAt: now
      }
      
      setStory(generatedStory)
      setCurrentTab("view")
      toast.success("Story generated successfully!")
    } catch (error) {
      console.error("Error generating story:", error)
      toast.error("Failed to generate story. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveStory = () => {
    if (!story) return

    const now = Date.now()
    const storyToSave: Story = {
      ...story,
      lastEditedAt: now,
      savedAt: story.savedAt || now
    }

    setSavedStories((current) => {
      const existing = (current || []).findIndex(s => s.id === story.id)
      if (existing !== -1) {
        const updated = [...(current || [])]
        updated[existing] = storyToSave
        return updated
      }
      return [...(current || []), storyToSave]
    })

    setStory(storyToSave)
    toast.success("Story saved successfully!")
  }

  const handleLoadStory = (savedStory: Story) => {
    setStory(savedStory)
    setStoryTitle(savedStory.title)
    setStoryDescription(savedStory.description)
    setGenre(savedStory.genre)
    setTone(savedStory.tone)
    setLength(savedStory.length)
    setNumChapters(savedStory.chapters.length.toString())
    setMainCharacter(savedStory.mainCharacter || "")
    setSetting(savedStory.setting || "")
    setConflict(savedStory.conflict || "")
    setAdditionalNotes(savedStory.additionalNotes || "")
    setCurrentTab("view")
    toast.success(`Loaded "${savedStory.title}"`)
  }

  const handleDeleteStory = (storyId: string) => {
    const storyToRemove = (savedStories || []).find(s => s.id === storyId)
    
    setSavedStories((current) => 
      (current || []).filter(s => s.id !== storyId)
    )

    if (story?.id === storyId) {
      setStory(null)
      handleReset()
    }

    toast.success(`"${storyToRemove?.title}" deleted`)
    setStoryToDelete(null)
  }

  const handleEditChapter = (chapterNumber: number, newContent: string) => {
    if (!story) return

    setStory(prev => {
      if (!prev) return prev
      return {
        ...prev,
        chapters: prev.chapters.map(ch =>
          ch.number === chapterNumber
            ? { ...ch, content: newContent }
            : ch
        ),
        lastEditedAt: Date.now()
      }
    })
  }

  const handleStartEditingChapter = (chapterNumber: number, content: string) => {
    setEditingChapter(chapterNumber)
    setEditedContent(content)
  }

  const handleSaveChapterEdit = () => {
    if (editingChapter === null) return
    handleEditChapter(editingChapter, editedContent)
    setEditingChapter(null)
    setEditedContent("")
    toast.success("Chapter updated")
  }

  const handleCancelChapterEdit = () => {
    setEditingChapter(null)
    setEditedContent("")
  }

  const handleReset = () => {
    setStoryTitle("")
    setStoryDescription("")
    setGenre("fantasy")
    setTone("adventurous")
    setLength("medium")
    setNumChapters("5")
    setMainCharacter("")
    setSetting("")
    setConflict("")
    setAdditionalNotes("")
    setStory(null)
    setCurrentTab("setup")
  }

  const handleDownload = () => {
    if (!story) return

    let content = `${story.title}\n`
    content += "=".repeat(story.title.length) + "\n\n"
    content += `Genre: ${story.genre} | Tone: ${story.tone}\n`
    content += `${story.description}\n\n`
    content += "─".repeat(50) + "\n\n"

    story.chapters.forEach((chapter) => {
      content += `Chapter ${chapter.number}: ${chapter.title}\n\n`
      content += `${chapter.content}\n\n`
      content += "─".repeat(50) + "\n\n"
    })

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${story.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success("Story downloaded successfully!")
  }

  const handleSaveToChat = () => {
    if (!story || !onSaveToChat) return

    let content = `📖 **${story.title}**\n\n`
    content += `*${story.genre} • ${story.tone}*\n\n`
    content += `${story.description}\n\n`
    content += `**${story.chapters.length} Chapters Generated**\n\n`
    
    story.chapters.forEach((chapter) => {
      content += `**Chapter ${chapter.number}: ${chapter.title}**\n\n`
      content += `${chapter.content.slice(0, 300)}${chapter.content.length > 300 ? '...' : ''}\n\n`
    })

    onSaveToChat(content)
    toast.success("Story preview sent to chat!")
    onClose()
  }

  const handleRegenerateChapter = async (chapterNumber: number) => {
    if (!story) return

    setIsGenerating(true)
    
    try {
      const chapter = story.chapters.find(ch => ch.number === chapterNumber)
      if (!chapter) return

      const previousChapters = story.chapters
        .filter(ch => ch.number < chapterNumber)
        .map(ch => `Chapter ${ch.number}: ${ch.title}\n${ch.content.slice(0, 200)}...`)
        .join('\n\n')

      const promptText = `You are continuing a story with the following details:

Title: ${story.title}
Genre: ${story.genre}
Tone: ${story.tone}
Description: ${story.description}

Previous chapters summary:
${previousChapters}

Generate a new version of Chapter ${chapterNumber} titled "${chapter.title}". 
Make it engaging, match the tone and genre, and ensure it flows naturally from the previous chapters.

Return only the chapter content as plain text, no JSON formatting.`

      const newContent = await window.spark.llm(promptText, "gpt-4o-mini")
      
      setStory(prev => {
        if (!prev) return prev
        return {
          ...prev,
          chapters: prev.chapters.map(ch =>
            ch.number === chapterNumber
              ? { ...ch, content: newContent }
              : ch
          )
        }
      })
      
      toast.success(`Chapter ${chapterNumber} regenerated!`)
    } catch (error) {
      console.error("Error regenerating chapter:", error)
      toast.error("Failed to regenerate chapter")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <BookOpen size={28} weight="fill" className="text-accent" />
                Story Creator
              </DialogTitle>
              <DialogDescription>
                Generate detailed stories with AI-powered creativity
              </DialogDescription>
            </div>
            {story && (
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveStory}
                  variant="outline"
                  size="sm"
                  className="gap-2 border-primary/50 text-primary hover:bg-primary/10"
                >
                  <FloppyDisk size={16} weight="fill" />
                  Save
                </Button>
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <DownloadSimple size={16} weight="bold" />
                  Download
                </Button>
                <Button
                  onClick={handleSaveToChat}
                  variant="outline"
                  size="sm"
                  className="gap-2 border-accent/50 text-accent hover:bg-accent/10"
                >
                  <Sparkle size={16} weight="fill" />
                  Send to Chat
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={(v) => setCurrentTab(v as any)} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="px-6 pt-4 shrink-0">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="saved" disabled={isGenerating}>
                <FolderOpen size={16} weight="fill" className="mr-1" />
                Saved
              </TabsTrigger>
              <TabsTrigger value="setup" disabled={isGenerating}>
                Setup
              </TabsTrigger>
              <TabsTrigger value="generate" disabled={isGenerating}>
                Generate
              </TabsTrigger>
              <TabsTrigger value="view" disabled={!story || isGenerating}>
                View Story
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 min-h-0">
            <div className="px-6 py-6">
              <TabsContent value="saved" className="mt-0 space-y-4">
                {sortedSavedStories && sortedSavedStories.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-muted-foreground">
                        {sortedSavedStories.length} saved {sortedSavedStories.length === 1 ? "story" : "stories"}
                      </p>
                    </div>
                    <AnimatePresence>
                      {sortedSavedStories.map((savedStory, index) => (
                        <motion.div
                          key={savedStory.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card className="group hover:border-accent/50 transition-colors cursor-pointer">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between gap-3">
                                <div 
                                  className="flex-1 min-w-0"
                                  onClick={() => handleLoadStory(savedStory)}
                                >
                                  <CardTitle className="text-lg mb-1 truncate">
                                    {savedStory.title}
                                  </CardTitle>
                                  <CardDescription className="line-clamp-2">
                                    {savedStory.description}
                                  </CardDescription>
                                  <div className="flex flex-wrap gap-2 mt-3">
                                    <Badge variant="secondary" className="text-xs">
                                      {savedStory.genre}
                                    </Badge>
                                    <Badge variant="secondary" className="text-xs">
                                      {savedStory.chapters.length} chapters
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {new Date(savedStory.lastEditedAt || savedStory.savedAt || 0).toLocaleDateString()}
                                    </Badge>
                                  </div>
                                </div>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setStoryToDelete(savedStory.id!)
                                  }}
                                  variant="ghost"
                                  size="icon"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash size={16} weight="fill" />
                                </Button>
                              </div>
                            </CardHeader>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-muted/30 rounded-full flex items-center justify-center">
                      <FolderOpen size={32} className="text-muted-foreground" weight="fill" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No saved stories yet</h3>
                    <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-4">
                      Create and save your stories to access them later for editing or viewing.
                    </p>
                    <Button
                      onClick={() => setCurrentTab("setup")}
                      variant="outline"
                      className="border-accent/50 text-accent hover:bg-accent/10"
                    >
                      <Plus size={16} weight="bold" className="mr-2" />
                      Create New Story
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="setup" className="mt-0 space-y-6">
                <Card className="border-accent/30 bg-gradient-to-br from-accent/5 to-primary/5">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <MagicWand size={18} weight="fill" className="text-accent" />
                          Quick Start Templates
                        </CardTitle>
                        <CardDescription>
                          Choose a template to get started quickly with pre-filled genre and tone
                        </CardDescription>
                      </div>
                      <Button
                        onClick={() => setTemplateEditorOpen(true)}
                        variant="outline"
                        size="sm"
                        className="gap-1.5 border-accent/50 text-accent hover:bg-accent/10"
                      >
                        <Plus size={14} weight="bold" />
                        <span className="hidden sm:inline">Manage Templates</span>
                        <span className="sm:hidden">Templates</span>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="max-h-[400px] overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {allTemplates.map((template) => (
                        <motion.button
                          key={template.id}
                          onClick={() => applyTemplate(template.id)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:border-accent/50 hover:bg-accent/5 transition-all text-left group"
                        >
                          <span className="text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                            {template.emoji}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm mb-1 flex items-center gap-2">
                              {template.name}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {template.description}
                            </p>
                            <div className="flex gap-1.5 mt-2">
                              <Badge variant="secondary" className="text-xs">
                                {template.genre}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {template.tone}
                              </Badge>
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="story-title">Story Title *</Label>
                    <Input
                      id="story-title"
                      placeholder="Enter your story title..."
                      value={storyTitle}
                      onChange={(e) => setStoryTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="story-desc">Story Description *</Label>
                    <Textarea
                      id="story-desc"
                      placeholder="Describe the main plot or premise of your story..."
                      value={storyDescription}
                      onChange={(e) => setStoryDescription(e.target.value)}
                      rows={4}
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Chapter Length</Label>
                      <Select value={length} onValueChange={setLength}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {lengths.map((l) => (
                            <SelectItem key={l.value} value={l.value}>
                              {l.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="num-chapters">Number of Chapters</Label>
                      <Input
                        id="num-chapters"
                        type="number"
                        min="1"
                        max="10"
                        value={numChapters}
                        onChange={(e) => setNumChapters(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={() => setCurrentTab("generate")}
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                    disabled={!storyTitle.trim() || !storyDescription.trim()}
                  >
                    Continue to Details
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="generate" className="mt-0 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Optional Details</CardTitle>
                    <CardDescription>
                      Add more details to make your story more specific
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="main-char">Main Character</Label>
                      <Input
                        id="main-char"
                        placeholder="e.g., A brave young wizard named Alex"
                        value={mainCharacter}
                        onChange={(e) => setMainCharacter(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="setting">Setting</Label>
                      <Input
                        id="setting"
                        placeholder="e.g., A magical school in the mountains"
                        value={setting}
                        onChange={(e) => setSetting(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="conflict">Central Conflict</Label>
                      <Textarea
                        id="conflict"
                        placeholder="e.g., The protagonist must prevent an ancient evil from awakening"
                        value={conflict}
                        onChange={(e) => setConflict(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Additional Notes</Label>
                      <Textarea
                        id="notes"
                        placeholder="Any other specific elements or requirements..."
                        value={additionalNotes}
                        onChange={(e) => setAdditionalNotes(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-accent/30 bg-accent/5">
                  <CardHeader>
                    <CardTitle className="text-base">Story Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{genre}</Badge>
                      <Badge variant="secondary">{tone}</Badge>
                      <Badge variant="secondary">{numChapters} chapters</Badge>
                      <Badge variant="secondary">{lengths.find(l => l.value === length)?.label.split(' ')[0]}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">
                      <strong>{storyTitle}</strong>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {storyDescription}
                    </p>
                  </CardContent>
                </Card>

                <div className="flex gap-2">
                  <Button
                    onClick={() => setCurrentTab("setup")}
                    variant="outline"
                    className="flex-1"
                    disabled={isGenerating}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleGenerate}
                    className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Sparkle size={18} weight="fill" />
                        </motion.div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkle size={18} weight="fill" />
                        Generate Story
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="view" className="mt-0 space-y-4">
                {story && (
                  <div className="space-y-6">
                    {isSupported && (
                      <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5">
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <SpeakerHigh size={20} weight="fill" className="text-primary" />
                              <div>
                                <CardTitle className="text-base">Voice Narration</CardTitle>
                                <CardDescription className="text-xs">
                                  Listen to your story read aloud
                                </CardDescription>
                              </div>
                            </div>
                            <Button
                              onClick={() => setVoiceSettingsOpen(!voiceSettingsOpen)}
                              variant="outline"
                              size="sm"
                              className="gap-2"
                            >
                              <SpeakerHigh size={16} weight="fill" />
                              Voice Settings
                            </Button>
                          </div>
                          <AnimatePresence>
                            {voiceSettingsOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="pt-4 space-y-4 border-t mt-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="voice-select" className="text-sm">
                                      Voice
                                    </Label>
                                    <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                                      <SelectTrigger id="voice-select" className="text-sm">
                                        <SelectValue placeholder="Select a voice" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {voices.length > 0 ? (
                                          voices
                                            .filter(v => v.lang.startsWith("en"))
                                            .map((voice) => (
                                              <SelectItem key={voice.name} value={voice.name}>
                                                {voice.name}
                                              </SelectItem>
                                            ))
                                        ) : (
                                          <SelectItem value="default">Default Voice</SelectItem>
                                        )}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <Label className="text-sm">Speed</Label>
                                      <span className="text-xs text-muted-foreground">{(narrationRate || 1.0).toFixed(1)}x</span>
                                    </div>
                                    <Slider
                                      value={[narrationRate || 1.0]}
                                      onValueChange={(value) => setNarrationRate(value[0])}
                                      min={0.5}
                                      max={2.0}
                                      step={0.1}
                                      className="w-full"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <Label className="text-sm">Pitch</Label>
                                      <span className="text-xs text-muted-foreground">{(narrationPitch || 1.0).toFixed(1)}</span>
                                    </div>
                                    <Slider
                                      value={[narrationPitch || 1.0]}
                                      onValueChange={(value) => setNarrationPitch(value[0])}
                                      min={0.5}
                                      max={2.0}
                                      step={0.1}
                                      className="w-full"
                                    />
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </CardHeader>
                      </Card>
                    )}

                    <Card className="border-accent/30 bg-gradient-to-br from-accent/5 to-primary/5">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-2xl">{story.title}</CardTitle>
                            <CardDescription className="mt-2">
                              {story.description}
                            </CardDescription>
                          </div>
                          <Button
                            onClick={handleReset}
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-foreground"
                            title="Create new story"
                          >
                            <Plus size={18} weight="bold" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-3">
                          <Badge>{story.genre}</Badge>
                          <Badge>{story.tone}</Badge>
                          <Badge>{story.chapters.length} chapters</Badge>
                        </div>
                      </CardHeader>
                    </Card>

                    <div className="space-y-4">
                      <AnimatePresence>
                        {story.chapters.map((chapter, index) => (
                          <motion.div
                            key={chapter.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <Card>
                              <CardHeader>
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline">Chapter {chapter.number}</Badge>
                                      <CardTitle className="text-lg">{chapter.title}</CardTitle>
                                    </div>
                                  </div>
                                  <div className="flex gap-1">
                                    {editingChapter === chapter.number ? (
                                      <>
                                        <Button
                                          onClick={handleSaveChapterEdit}
                                          variant="ghost"
                                          size="sm"
                                          className="gap-1 text-primary hover:text-primary hover:bg-primary/10"
                                        >
                                          <FloppyDisk size={14} weight="fill" />
                                          Save
                                        </Button>
                                        <Button
                                          onClick={handleCancelChapterEdit}
                                          variant="ghost"
                                          size="sm"
                                          className="gap-1"
                                        >
                                          <X size={14} />
                                          Cancel
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        {isSupported && (
                                          <>
                                            {narratingChapter === chapter.number && isSpeaking ? (
                                              <Button
                                                onClick={handleStopNarration}
                                                variant="ghost"
                                                size="sm"
                                                className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                                              >
                                                <Stop size={14} weight="fill" />
                                                Stop
                                              </Button>
                                            ) : (
                                              <Button
                                                onClick={() => handleNarrateChapter(chapter.number)}
                                                variant="ghost"
                                                size="sm"
                                                className="gap-1 text-primary hover:text-primary hover:bg-primary/10"
                                                disabled={isSpeaking || isGenerating}
                                              >
                                                <Play size={14} weight="fill" />
                                                Narrate
                                              </Button>
                                            )}
                                          </>
                                        )}
                                        <Button
                                          onClick={() => handleStartEditingChapter(chapter.number, chapter.content)}
                                          variant="ghost"
                                          size="sm"
                                          className="gap-1 text-muted-foreground hover:text-accent"
                                          disabled={isGenerating}
                                        >
                                          <Sparkle size={14} />
                                          Edit
                                        </Button>
                                        <Button
                                          onClick={() => handleRegenerateChapter(chapter.number)}
                                          variant="ghost"
                                          size="sm"
                                          className="gap-1 text-muted-foreground hover:text-accent"
                                          disabled={isGenerating}
                                        >
                                          <ArrowCounterClockwise size={14} />
                                          Regenerate
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                {editingChapter === chapter.number ? (
                                  <Textarea
                                    value={editedContent}
                                    onChange={(e) => setEditedContent(e.target.value)}
                                    className="min-h-[300px] text-sm leading-relaxed font-normal"
                                    placeholder="Edit chapter content..."
                                  />
                                ) : (
                                  <div className="relative">
                                    {narratingChapter === chapter.number && isSpeaking && (
                                      <div className="absolute top-0 left-0 right-0 flex items-center gap-2 mb-3 p-2 bg-primary/10 border border-primary/30 rounded-lg">
                                        <motion.div
                                          animate={{ scale: [1, 1.2, 1] }}
                                          transition={{ duration: 1.5, repeat: Infinity }}
                                        >
                                          <SpeakerHigh size={16} weight="fill" className="text-primary" />
                                        </motion.div>
                                        <span className="text-xs font-medium text-primary">
                                          Reading chapter aloud...
                                        </span>
                                      </div>
                                    )}
                                    <div className={`text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground ${narratingChapter === chapter.number && isSpeaking ? 'pt-12' : ''}`}>
                                      {chapter.content}
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </DialogContent>

      <AlertDialog open={!!storyToDelete} onOpenChange={() => setStoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Story?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{(sortedSavedStories || []).find(s => s.id === storyToDelete)?.title}". 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => storyToDelete && handleDeleteStory(storyToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TemplateEditor
        open={templateEditorOpen}
        onClose={() => setTemplateEditorOpen(false)}
        onSelectTemplate={handleSelectCustomTemplate}
      />
    </Dialog>
  )
}

import { useState } from "react"
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
import { Sparkle, BookOpen, DownloadSimple, Plus, X, ArrowCounterClockwise } from "@phosphor-icons/react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

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
  title: string
  genre: string
  tone: string
  length: string
  chapters: StoryChapter[]
  description: string
}

export function StoryCreator({ open, onClose, onSaveToChat }: StoryCreatorProps) {
  const [currentTab, setCurrentTab] = useState<"setup" | "generate" | "view">("setup")
  const [isGenerating, setIsGenerating] = useState(false)
  const [story, setStory] = useState<Story | null>(null)
  
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
      
      const generatedStory: Story = {
        title: storyTitle,
        genre,
        tone,
        length,
        description: storyDescription,
        chapters: parsed.chapters.map((ch: any) => ({
          id: `chapter-${ch.number}`,
          number: ch.number,
          title: ch.title,
          content: ch.content
        }))
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
      <DialogContent className="max-w-4xl h-[85vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
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

        <Tabs value={currentTab} onValueChange={(v) => setCurrentTab(v as any)} className="flex-1 flex flex-col">
          <div className="px-6 pt-4">
            <TabsList className="grid w-full grid-cols-3">
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

          <ScrollArea className="flex-1 px-6">
            <div className="py-6">
              <TabsContent value="setup" className="mt-0 space-y-6">
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
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                                  {chapter.content}
                                </div>
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
    </Dialog>
  )
}

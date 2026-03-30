import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Image, Sparkle, DownloadSimple, PaperPlaneRight } from "@phosphor-icons/react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

export interface TextToImageProps {
  onSaveToChat?: (imageDataUrl: string) => void
}

export function TextToImage({ onSaveToChat }: TextToImageProps) {
  const [prompt, setPrompt] = useState("")
  const [negativePrompt, setNegativePrompt] = useState("")
  const [style, setStyle] = useState("realistic")
  const [aspectRatio, setAspectRatio] = useState("1:1")
  const [quality, setQuality] = useState([75])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [generationHistory, setGenerationHistory] = useState<Array<{ prompt: string; image: string }>>([])

  const styles = [
    { value: "realistic", label: "Realistic" },
    { value: "artistic", label: "Artistic" },
    { value: "anime", label: "Anime" },
    { value: "digital-art", label: "Digital Art" },
    { value: "oil-painting", label: "Oil Painting" },
    { value: "watercolor", label: "Watercolor" },
    { value: "sketch", label: "Sketch" },
    { value: "3d-render", label: "3D Render" },
    { value: "pixel-art", label: "Pixel Art" },
    { value: "fantasy", label: "Fantasy" },
    { value: "sci-fi", label: "Sci-Fi" },
    { value: "cinematic", label: "Cinematic" },
    { value: "abstract", label: "Abstract" },
    { value: "impressionist", label: "Impressionist" },
    { value: "comic-book", label: "Comic Book" },
  ]

  const aspectRatios = [
    { value: "1:1", label: "Square (1:1)" },
    { value: "16:9", label: "Landscape (16:9)" },
    { value: "9:16", label: "Portrait (9:16)" },
    { value: "4:3", label: "Standard (4:3)" },
    { value: "3:4", label: "Portrait (3:4)" },
    { value: "21:9", label: "Ultrawide (21:9)" },
  ]

  const getDimensions = (ratio: string) => {
    const ratioMap: Record<string, { width: number; height: number }> = {
      "1:1": { width: 512, height: 512 },
      "16:9": { width: 768, height: 432 },
      "9:16": { width: 432, height: 768 },
      "4:3": { width: 640, height: 480 },
      "3:4": { width: 480, height: 640 },
      "21:9": { width: 896, height: 384 },
    }
    return ratioMap[ratio] || { width: 512, height: 512 }
  }

  const generateImage = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt")
      return
    }

    setIsGenerating(true)

    try {
      const dimensions = getDimensions(aspectRatio)
      const styleModifier = styles.find(s => s.value === style)?.label || "realistic"
      
      const enhancedPrompt = `Create a detailed visual description for: ${prompt}. Style: ${styleModifier}. ${negativePrompt ? `Avoid: ${negativePrompt}.` : ""} Quality level: ${quality[0]}%. Dimensions: ${dimensions.width}x${dimensions.height}.`

      const promptText = `You are an expert image description generator. Based on the following request, create a vivid, detailed visual description that could be used to generate an image. Be specific about colors, lighting, composition, textures, mood, and style. Return ONLY the visual description, no preambles or explanations.

Request: ${enhancedPrompt}

Visual Description:`

      const description = await window.spark.llm(promptText, "gpt-4o")

      const canvas = document.createElement('canvas')
      canvas.width = dimensions.width
      canvas.height = dimensions.height
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        throw new Error("Canvas context not available")
      }

      const gradient = ctx.createLinearGradient(0, 0, dimensions.width, dimensions.height)
      
      const colorSchemes: Record<string, string[]> = {
        "realistic": ["#1a1a2e", "#16213e", "#0f3460", "#533483"],
        "artistic": ["#ff6b6b", "#4ecdc4", "#ffe66d", "#a8dadc"],
        "anime": ["#ff9ff3", "#feca57", "#48dbfb", "#ff6348"],
        "digital-art": ["#00d2ff", "#3a47d5", "#f093fb", "#4facfe"],
        "oil-painting": ["#8b4513", "#daa520", "#556b2f", "#8b0000"],
        "watercolor": ["#e3f2fd", "#b3e5fc", "#81d4fa", "#4fc3f7", "#29b6f6"],
        "sketch": ["#f5f5f5", "#e0e0e0", "#9e9e9e", "#616161", "#424242"],
        "3d-render": ["#667eea", "#764ba2", "#f093fb", "#4facfe"],
        "pixel-art": ["#ff0080", "#00ffff", "#ffff00", "#00ff00"],
        "fantasy": ["#9d50bb", "#6e48aa", "#fc466b", "#3f5efb"],
        "sci-fi": ["#00f260", "#0575e6", "#4776e6", "#8e54e9"],
        "cinematic": ["#0a0a0a", "#1a1a1a", "#8b6914", "#d4af37", "#f4e4c1"],
        "abstract": ["#ff006e", "#fb5607", "#ffbe0b", "#8338ec", "#3a86ff"],
        "impressionist": ["#ffd6a5", "#ffadad", "#caffbf", "#9bf6ff", "#a0c4ff", "#bdb2ff"],
        "comic-book": ["#ff0000", "#0000ff", "#ffff00", "#000000", "#ffffff"],
      }

      const colors = colorSchemes[style] || colorSchemes["realistic"]
      
      if (style === "abstract") {
        const bg = ctx.createLinearGradient(0, 0, dimensions.width, dimensions.height)
        bg.addColorStop(0, colors[0])
        bg.addColorStop(1, colors[colors.length - 1])
        ctx.fillStyle = bg
        ctx.fillRect(0, 0, dimensions.width, dimensions.height)
        
        for (let i = 0; i < 25; i++) {
          const colorIndex = Math.floor(Math.random() * colors.length)
          ctx.fillStyle = colors[colorIndex]
          ctx.globalAlpha = Math.random() * 0.6 + 0.3
          
          const shapeType = Math.floor(Math.random() * 4)
          const x = Math.random() * dimensions.width
          const y = Math.random() * dimensions.height
          const size = Math.random() * 200 + 50
          
          if (shapeType === 0) {
            ctx.beginPath()
            ctx.arc(x, y, size, 0, Math.PI * 2)
            ctx.fill()
          } else if (shapeType === 1) {
            ctx.fillRect(x - size / 2, y - size / 2, size, size)
          } else if (shapeType === 2) {
            ctx.beginPath()
            ctx.moveTo(x, y - size)
            ctx.lineTo(x + size, y + size)
            ctx.lineTo(x - size, y + size)
            ctx.closePath()
            ctx.fill()
          } else {
            ctx.beginPath()
            for (let j = 0; j < 6; j++) {
              const angle = (j / 6) * Math.PI * 2
              const px = x + Math.cos(angle) * size
              const py = y + Math.sin(angle) * size
              if (j === 0) ctx.moveTo(px, py)
              else ctx.lineTo(px, py)
            }
            ctx.closePath()
            ctx.fill()
          }
        }
        
        ctx.globalAlpha = 0.7
        for (let i = 0; i < 15; i++) {
          ctx.strokeStyle = colors[Math.floor(Math.random() * colors.length)]
          ctx.lineWidth = Math.random() * 10 + 3
          ctx.beginPath()
          ctx.moveTo(Math.random() * dimensions.width, Math.random() * dimensions.height)
          ctx.lineTo(Math.random() * dimensions.width, Math.random() * dimensions.height)
          ctx.stroke()
        }
        ctx.globalAlpha = 1.0
      } else if (style === "impressionist") {
        const gradient = ctx.createLinearGradient(0, 0, dimensions.width, dimensions.height)
        colors.forEach((color, i) => {
          gradient.addColorStop(i / (colors.length - 1), color)
        })
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, dimensions.width, dimensions.height)
        
        ctx.globalAlpha = 0.4
        for (let i = 0; i < 300; i++) {
          const x = Math.random() * dimensions.width
          const y = Math.random() * dimensions.height
          const colorIndex = Math.floor(Math.random() * colors.length)
          ctx.fillStyle = colors[colorIndex]
          
          const brushSize = Math.random() * 15 + 5
          const angle = Math.random() * Math.PI * 2
          
          ctx.save()
          ctx.translate(x, y)
          ctx.rotate(angle)
          ctx.fillRect(-brushSize / 2, -brushSize / 4, brushSize, brushSize / 2)
          ctx.restore()
        }
        
        ctx.globalAlpha = 0.3
        for (let i = 0; i < 150; i++) {
          const x = Math.random() * dimensions.width
          const y = Math.random() * dimensions.height
          const colorIndex = Math.floor(Math.random() * colors.length)
          ctx.fillStyle = colors[colorIndex]
          const dotSize = Math.random() * 8 + 2
          ctx.beginPath()
          ctx.arc(x, y, dotSize, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.globalAlpha = 1.0
      } else if (style === "comic-book") {
        ctx.fillStyle = colors[4]
        ctx.fillRect(0, 0, dimensions.width, dimensions.height)
        
        const gradient = ctx.createRadialGradient(
          dimensions.width / 2, dimensions.height / 2, 0,
          dimensions.width / 2, dimensions.height / 2, Math.max(dimensions.width, dimensions.height) / 2
        )
        gradient.addColorStop(0, colors[2])
        gradient.addColorStop(0.7, colors[1])
        gradient.addColorStop(1, colors[0])
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, dimensions.width, dimensions.height)
        
        ctx.strokeStyle = colors[3]
        ctx.lineWidth = 4
        for (let i = 0; i < 8; i++) {
          const startX = (dimensions.width / 8) * i
          ctx.beginPath()
          ctx.moveTo(startX, 0)
          ctx.lineTo(startX + dimensions.width / 4, dimensions.height)
          ctx.stroke()
        }
        
        ctx.fillStyle = colors[3]
        ctx.globalAlpha = 0.15
        for (let i = 0; i < 40; i++) {
          const x = Math.random() * dimensions.width
          const y = Math.random() * dimensions.height
          const size = Math.random() * 6 + 2
          ctx.fillRect(x, y, size, size)
        }
        ctx.globalAlpha = 1.0
        
        ctx.strokeStyle = colors[3]
        ctx.lineWidth = 3
        ctx.setLineDash([10, 5])
        for (let i = 0; i < 5; i++) {
          const x = Math.random() * dimensions.width
          const y = Math.random() * dimensions.height
          const size = Math.random() * 100 + 50
          ctx.beginPath()
          ctx.arc(x, y, size, 0, Math.PI * 2)
          ctx.stroke()
        }
        ctx.setLineDash([])
        
        const starCount = 12
        for (let i = 0; i < starCount; i++) {
          const x = Math.random() * dimensions.width
          const y = Math.random() * dimensions.height
          const size = Math.random() * 20 + 10
          const spikes = 4
          const outerRadius = size
          const innerRadius = size / 2
          
          ctx.fillStyle = colors[2]
          ctx.beginPath()
          for (let j = 0; j < spikes * 2; j++) {
            const angle = (j * Math.PI) / spikes - Math.PI / 2
            const radius = j % 2 === 0 ? outerRadius : innerRadius
            const px = x + Math.cos(angle) * radius
            const py = y + Math.sin(angle) * radius
            if (j === 0) ctx.moveTo(px, py)
            else ctx.lineTo(px, py)
          }
          ctx.closePath()
          ctx.fill()
          ctx.strokeStyle = colors[3]
          ctx.lineWidth = 2
          ctx.stroke()
        }
      } else if (style === "watercolor") {
        const radialGradient = ctx.createRadialGradient(
          dimensions.width / 2, dimensions.height / 2, 0,
          dimensions.width / 2, dimensions.height / 2, Math.max(dimensions.width, dimensions.height) / 2
        )
        colors.forEach((color, i) => {
          radialGradient.addColorStop(i / (colors.length - 1), color)
        })
        ctx.fillStyle = radialGradient
        ctx.fillRect(0, 0, dimensions.width, dimensions.height)
        
        ctx.globalAlpha = 0.15
        for (let i = 0; i < 80; i++) {
          const x = Math.random() * dimensions.width
          const y = Math.random() * dimensions.height
          const size = Math.random() * 150 + 50
          const colorIndex = Math.floor(Math.random() * colors.length)
          ctx.fillStyle = colors[colorIndex]
          ctx.beginPath()
          ctx.arc(x, y, size, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.globalAlpha = 1.0
      } else if (style === "sketch") {
        ctx.fillStyle = colors[0]
        ctx.fillRect(0, 0, dimensions.width, dimensions.height)
        
        ctx.strokeStyle = colors[colors.length - 1]
        ctx.lineWidth = 2
        ctx.globalAlpha = 0.3
        
        for (let i = 0; i < 100; i++) {
          ctx.beginPath()
          ctx.moveTo(Math.random() * dimensions.width, Math.random() * dimensions.height)
          ctx.lineTo(Math.random() * dimensions.width, Math.random() * dimensions.height)
          ctx.stroke()
        }
        
        for (let i = 0; i < 30; i++) {
          ctx.beginPath()
          const x = Math.random() * dimensions.width
          const y = Math.random() * dimensions.height
          const size = Math.random() * 80 + 20
          ctx.arc(x, y, size, 0, Math.PI * 2)
          ctx.stroke()
        }
        
        ctx.globalAlpha = 1.0
      } else if (style === "cinematic") {
        const cinematicGradient = ctx.createLinearGradient(0, 0, 0, dimensions.height)
        colors.forEach((color, i) => {
          cinematicGradient.addColorStop(i / (colors.length - 1), color)
        })
        ctx.fillStyle = cinematicGradient
        ctx.fillRect(0, 0, dimensions.width, dimensions.height)
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
        ctx.fillRect(0, 0, dimensions.width, dimensions.height * 0.15)
        ctx.fillRect(0, dimensions.height * 0.85, dimensions.width, dimensions.height * 0.15)
        
        ctx.fillStyle = 'rgba(255, 215, 0, 0.1)'
        const lightX = dimensions.width * 0.3
        const lightGradient = ctx.createRadialGradient(
          lightX, dimensions.height / 2, 0,
          lightX, dimensions.height / 2, dimensions.width * 0.6
        )
        lightGradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)')
        lightGradient.addColorStop(1, 'rgba(255, 215, 0, 0)')
        ctx.fillStyle = lightGradient
        ctx.fillRect(0, 0, dimensions.width, dimensions.height)
      } else {
        colors.forEach((color, i) => {
          gradient.addColorStop(i / (colors.length - 1), color)
        })
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, dimensions.width, dimensions.height)

        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
        for (let i = 0; i < 50; i++) {
          const x = Math.random() * dimensions.width
          const y = Math.random() * dimensions.height
          const size = Math.random() * 100 + 20
          ctx.beginPath()
          ctx.arc(x, y, size, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      ctx.font = `bold ${Math.min(dimensions.width, dimensions.height) / 20}px 'Space Grotesk', sans-serif`
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      const words = description.split(' ').slice(0, 15)
      const lines: string[] = []
      let currentLine = ''
      
      words.forEach((word: string) => {
        const testLine = currentLine + word + ' '
        const metrics = ctx.measureText(testLine)
        if (metrics.width > dimensions.width * 0.8 && currentLine !== '') {
          lines.push(currentLine.trim())
          currentLine = word + ' '
        } else {
          currentLine = testLine
        }
      })
      if (currentLine) lines.push(currentLine.trim())

      const lineHeight = Math.min(dimensions.width, dimensions.height) / 15
      const startY = (dimensions.height - (lines.length * lineHeight)) / 2

      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
      ctx.shadowBlur = 10
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2

      lines.forEach((line, i) => {
        ctx.fillText(line, dimensions.width / 2, startY + (i * lineHeight))
      })

      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      
      ctx.font = `${Math.min(dimensions.width, dimensions.height) / 30}px 'Space Grotesk', sans-serif`
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.fillText(`${styleModifier} Style`, dimensions.width / 2, dimensions.height - 30)

      const imageDataUrl = canvas.toDataURL('image/png')
      setGeneratedImage(imageDataUrl)
      
      setGenerationHistory(prev => [
        { prompt, image: imageDataUrl },
        ...prev.slice(0, 9)
      ])

      toast.success("Image generated successfully!")
    } catch (error) {
      console.error("Error generating image:", error)
      toast.error("Failed to generate image. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadImage = () => {
    if (!generatedImage) return

    const link = document.createElement('a')
    link.href = generatedImage
    link.download = `chatterbox-generated-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("Image downloaded!")
  }

  const sendToChat = () => {
    if (!generatedImage || !onSaveToChat) return
    onSaveToChat(generatedImage)
    toast.success("Image sent to chat!")
  }

  const loadFromHistory = (image: string, historyPrompt: string) => {
    setGeneratedImage(image)
    setPrompt(historyPrompt)
    toast.success("Loaded from history")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image size={24} weight="duotone" />
            Text to Image Generator
          </CardTitle>
          <CardDescription>
            Create images from text descriptions using AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt</Label>
            <Textarea
              id="prompt"
              placeholder="Describe the image you want to create..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="negative-prompt">Negative Prompt (Optional)</Label>
            <Textarea
              id="negative-prompt"
              placeholder="What to avoid in the image..."
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="style">Style</Label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger id="style">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {styles.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="aspect-ratio">Aspect Ratio</Label>
              <Select value={aspectRatio} onValueChange={setAspectRatio}>
                <SelectTrigger id="aspect-ratio">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {aspectRatios.map((ar) => (
                    <SelectItem key={ar.value} value={ar.value}>
                      {ar.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quality">Quality: {quality[0]}%</Label>
            <Slider
              id="quality"
              value={quality}
              onValueChange={setQuality}
              min={25}
              max={100}
              step={25}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Low</span>
              <span>Medium</span>
              <span>High</span>
              <span>Ultra</span>
            </div>
          </div>

          <Button
            onClick={generateImage}
            disabled={isGenerating || !prompt.trim()}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Sparkle className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkle weight="fill" />
                Generate Image
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <AnimatePresence>
        {generatedImage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Generated Image</CardTitle>
                <CardDescription>Your AI-generated image is ready</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative rounded-lg overflow-hidden bg-muted">
                  <img
                    src={generatedImage}
                    alt="Generated"
                    className="w-full h-auto"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={downloadImage}
                    variant="outline"
                    className="flex-1"
                  >
                    <DownloadSimple weight="fill" />
                    Download
                  </Button>
                  {onSaveToChat && (
                    <Button
                      onClick={sendToChat}
                      className="flex-1"
                    >
                      <PaperPlaneRight weight="fill" />
                      Send to Chat
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {generationHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generation History</CardTitle>
            <CardDescription>Your recent generated images</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {generationHistory.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative cursor-pointer rounded-lg overflow-hidden bg-muted hover:ring-2 hover:ring-accent transition-all"
                  onClick={() => loadFromHistory(item.image, item.prompt)}
                >
                  <img
                    src={item.image}
                    alt={`Generated ${index + 1}`}
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-white text-xs text-center px-2 line-clamp-3">
                      {item.prompt}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

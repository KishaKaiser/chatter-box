/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react"
import { llm } from "@/lib/llm"
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
    { value: "pop-art", label: "Pop Art" },
    { value: "graffiti", label: "Graffiti" },
    { value: "minimalist", label: "Minimalist" },
    { value: "surrealism", label: "Surrealism" },
    { value: "vaporwave", label: "Vaporwave" },
    { value: "cyberpunk", label: "Cyberpunk" },
    { value: "steampunk", label: "Steampunk" },
    { value: "gothic", label: "Gothic" },
    { value: "renaissance", label: "Renaissance" },
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
      
      const enhancedPrompt = `Create an image of: ${prompt}. Style: ${styleModifier}. ${negativePrompt ? `Avoid: ${negativePrompt}.` : ""}`

      const aiPrompt = `You are an AI image composition expert. Analyze this image request and create detailed canvas drawing instructions.

User Request: "${enhancedPrompt}"

Return ONLY a valid JSON object (no markdown, no explanation):
{
  "scene": {
    "background": {
      "type": "gradient",
      "colors": ["#hex1", "#hex2"],
      "direction": "vertical"
    },
    "complexSubject": {
      "type": "face|cat|dog|wolf|lion|other",
      "position": {"x": 0.5, "y": 0.5},
      "size": 0.7,
      "rotation": 0,
      "layers": [
        {"part": "head", "shape": "circle", "position": {"x": 0.0, "y": 0.0}, "size": 0.5, "color": "#hex", "rotation": 0, "zIndex": 1}
      ],
      "features": [
        {"type": "eye", "position": {"x": 0.45, "y": 0.42}, "size": 0.06, "color": "#hex", "shape": "circle", "detail": "highlight"}
      ],
      "shading": [
        {"area": "left", "type": "shadow", "color": "#000000", "opacity": 0.2, "size": 0.3, "position": {"x": 0.3, "y": 0.5}}
      ]
    },
    "elements": [],
    "lighting": {"type": "soft", "source": {"x": 0.8, "y": 0.2}, "intensity": 0.5}
  }
}`

      const response = await llm(aiPrompt, true)
      const sceneData = JSON.parse(response)

      const canvas = document.createElement('canvas')
      canvas.width = dimensions.width
      canvas.height = dimensions.height
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        throw new Error("Canvas context not available")
      }

      const scene = sceneData.scene || sceneData

      const drawBackground = () => {
        const bg = scene.background || { type: 'gradient', colors: ['#1a1a2e', '#16213e'], direction: 'vertical' }
        const colors = bg.colors || ['#1a1a2e', '#16213e']
        
        if (bg.type === 'gradient') {
          let gradient
          if (bg.direction === 'radial') {
            gradient = ctx.createRadialGradient(
              dimensions.width / 2, dimensions.height / 2, 0,
              dimensions.width / 2, dimensions.height / 2, Math.max(dimensions.width, dimensions.height) / 2
            )
          } else if (bg.direction === 'diagonal') {
            gradient = ctx.createLinearGradient(0, 0, dimensions.width, dimensions.height)
          } else if (bg.direction === 'horizontal') {
            gradient = ctx.createLinearGradient(0, 0, dimensions.width, 0)
          } else {
            gradient = ctx.createLinearGradient(0, 0, 0, dimensions.height)
          }
          
          colors.forEach((color: string, i: number) => {
            gradient.addColorStop(i / Math.max(colors.length - 1, 1), color)
          })
          ctx.fillStyle = gradient
        } else {
          ctx.fillStyle = colors[0] || '#1a1a2e'
        }
        
        ctx.fillRect(0, 0, dimensions.width, dimensions.height)
      }

      const drawComplexSubject = () => {
        const complexSubject = scene.complexSubject
        if (!complexSubject) return
        
        const baseX = (complexSubject.position?.x || 0.5) * dimensions.width
        const baseY = (complexSubject.position?.y || 0.5) * dimensions.height
        const baseSize = (complexSubject.size || 0.6) * Math.min(dimensions.width, dimensions.height)
        const baseRotation = (complexSubject.rotation || 0) * Math.PI / 180
        
        ctx.save()
        ctx.translate(baseX, baseY)
        ctx.rotate(baseRotation)
        
        const layers = complexSubject.layers || []
        const sortedLayers = [...layers].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
        
        sortedLayers.forEach((layer: any) => {
          const layerX = (layer.position?.x || 0) * baseSize
          const layerY = (layer.position?.y || 0) * baseSize
          const layerSize = (layer.size || 0.3) * baseSize
          const layerRotation = (layer.rotation || 0) * Math.PI / 180
          const layerColor = layer.color || '#ffffff'
          
          ctx.save()
          ctx.translate(layerX, layerY)
          ctx.rotate(layerRotation)
          
          ctx.fillStyle = layerColor
          ctx.strokeStyle = layerColor
          
          const shape = layer.shape || 'circle'
          
          if (shape === 'circle') {
            ctx.beginPath()
            ctx.arc(0, 0, layerSize / 2, 0, Math.PI * 2)
            ctx.fill()
          } else if (shape === 'ellipse') {
            ctx.beginPath()
            ctx.ellipse(0, 0, layerSize / 2, layerSize / 3, 0, 0, Math.PI * 2)
            ctx.fill()
          } else if (shape === 'arc') {
            const startAngle = (layer.startAngle || 0) * Math.PI / 180
            const endAngle = (layer.endAngle || 180) * Math.PI / 180
            ctx.beginPath()
            ctx.arc(0, 0, layerSize / 2, startAngle, endAngle)
            ctx.lineWidth = layerSize * 0.1
            ctx.stroke()
          } else if (shape === 'curve' || shape === 'bezier') {
            ctx.beginPath()
            ctx.moveTo(-layerSize / 2, 0)
            const cp1x = (layer.cp1?.x || -0.25) * layerSize
            const cp1y = (layer.cp1?.y || -0.25) * layerSize
            const cp2x = (layer.cp2?.x || 0.25) * layerSize
            const cp2y = (layer.cp2?.y || -0.25) * layerSize
            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, layerSize / 2, 0)
            ctx.lineWidth = layerSize * 0.08
            ctx.stroke()
          } else if (shape === 'triangle') {
            ctx.beginPath()
            ctx.moveTo(0, -layerSize / 2)
            ctx.lineTo(layerSize / 2, layerSize / 2)
            ctx.lineTo(-layerSize / 2, layerSize / 2)
            ctx.closePath()
            ctx.fill()
          } else if (shape === 'rectangle') {
            ctx.fillRect(-layerSize / 2, -layerSize / 2, layerSize, layerSize)
          }
          
          ctx.restore()
        })
        
        const features = complexSubject.features || []
        features.forEach((feature: any) => {
          const featX = (feature.position?.x || 0) * baseSize
          const featY = (feature.position?.y || 0) * baseSize
          const featSize = (feature.size || 0.05) * baseSize
          const featColor = feature.color || '#ffffff'
          const featShape = feature.shape || 'circle'
          
          ctx.save()
          ctx.fillStyle = featColor
          ctx.strokeStyle = featColor
          
          if (featShape === 'circle') {
            ctx.beginPath()
            ctx.arc(featX, featY, featSize / 2, 0, Math.PI * 2)
            ctx.fill()
            
            if (feature.detail === 'highlight') {
              ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
              ctx.beginPath()
              ctx.arc(featX - featSize * 0.15, featY - featSize * 0.15, featSize * 0.2, 0, Math.PI * 2)
              ctx.fill()
            } else if (feature.detail === 'outline') {
              ctx.lineWidth = featSize * 0.1
              ctx.beginPath()
              ctx.arc(featX, featY, featSize / 2, 0, Math.PI * 2)
              ctx.stroke()
            }
          } else if (featShape === 'ellipse') {
            ctx.beginPath()
            ctx.ellipse(featX, featY, featSize / 2, featSize / 3, 0, 0, Math.PI * 2)
            ctx.fill()
          } else if (featShape === 'line') {
            ctx.lineWidth = featSize * 0.1
            ctx.beginPath()
            ctx.moveTo(featX - featSize / 2, featY)
            ctx.lineTo(featX + featSize / 2, featY)
            ctx.stroke()
          } else if (featShape === 'arc') {
            const startAngle = (feature.startAngle || 0) * Math.PI / 180
            const endAngle = (feature.endAngle || 180) * Math.PI / 180
            ctx.lineWidth = featSize * 0.15
            ctx.beginPath()
            ctx.arc(featX, featY, featSize / 2, startAngle, endAngle)
            ctx.stroke()
          }
          
          ctx.restore()
        })
        
        const shading = complexSubject.shading || []
        shading.forEach((shade: any) => {
          const shadeX = (shade.position?.x || 0.5) * baseSize
          const shadeY = (shade.position?.y || 0.5) * baseSize
          const shadeSize = (shade.size || 0.2) * baseSize
          const shadeColor = shade.color || '#000000'
          const opacity = shade.opacity || 0.3
          
          ctx.save()
          
          const gradient = ctx.createRadialGradient(
            shadeX, shadeY, 0,
            shadeX, shadeY, shadeSize
          )
          
          if (shade.type === 'shadow') {
            gradient.addColorStop(0, `${shadeColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`)
            gradient.addColorStop(1, `${shadeColor}00`)
          } else if (shade.type === 'highlight') {
            gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`)
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
          }
          
          ctx.fillStyle = gradient
          ctx.fillRect(shadeX - shadeSize, shadeY - shadeSize, shadeSize * 2, shadeSize * 2)
          
          ctx.restore()
        })
        
        ctx.restore()
      }

      const drawMainSubject = () => {
        const subject = scene.mainSubject
        if (!subject) return
        
        const x = (subject.position?.x || 0.5) * dimensions.width
        const y = (subject.position?.y || 0.5) * dimensions.height
        const size = (subject.size || 0.4) * Math.min(dimensions.width, dimensions.height)
        const colors = subject.colors || ['#ffffff', '#cccccc']
        
        ctx.save()
        
        if (subject.type === 'text' && subject.text) {
          const fontSize = size * 0.3
          ctx.font = `bold ${fontSize}px 'Space Grotesk', sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          
          const gradient = ctx.createLinearGradient(x - size / 2, y - size / 4, x + size / 2, y + size / 4)
          colors.forEach((color: string, i: number) => {
            gradient.addColorStop(i / Math.max(colors.length - 1, 1), color)
          })
          
          ctx.fillStyle = gradient
          ctx.shadowBlur = 20
          ctx.shadowColor = colors[0]
          ctx.fillText(subject.text, x, y)
          ctx.shadowBlur = 0
        } else {
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, size / 2)
          colors.forEach((color: string, i: number) => {
            gradient.addColorStop(i / Math.max(colors.length - 1, 1), color)
          })
          ctx.fillStyle = gradient
          
          const shape = subject.shape || 'circle'
          
          if (shape === 'circle') {
            ctx.beginPath()
            ctx.arc(x, y, size / 2, 0, Math.PI * 2)
            ctx.fill()
          } else if (shape === 'rectangle') {
            ctx.fillRect(x - size / 2, y - size / 2, size, size)
          } else if (shape === 'triangle') {
            ctx.beginPath()
            ctx.moveTo(x, y - size / 2)
            ctx.lineTo(x + size / 2, y + size / 2)
            ctx.lineTo(x - size / 2, y + size / 2)
            ctx.closePath()
            ctx.fill()
          } else if (shape === 'ellipse') {
            ctx.beginPath()
            ctx.ellipse(x, y, size / 2, size / 3, 0, 0, Math.PI * 2)
            ctx.fill()
          } else if (shape === 'star') {
            ctx.beginPath()
            const spikes = 5
            for (let i = 0; i < spikes * 2; i++) {
              const angle = (i * Math.PI) / spikes - Math.PI / 2
              const radius = i % 2 === 0 ? size / 2 : size / 4
              const px = x + Math.cos(angle) * radius
              const py = y + Math.sin(angle) * radius
              if (i === 0) ctx.moveTo(px, py)
              else ctx.lineTo(px, py)
            }
            ctx.closePath()
            ctx.fill()
          } else {
            ctx.beginPath()
            ctx.arc(x, y, size / 2, 0, Math.PI * 2)
            ctx.fill()
          }
        }
        
        ctx.restore()
      }

      const drawElements = () => {
        const elements = scene.elements || []
        
        elements.forEach((element: any) => {
          const x = (element.position?.x || 0.5) * dimensions.width
          const y = (element.position?.y || 0.5) * dimensions.height
          const size = (element.size || 0.1) * Math.min(dimensions.width, dimensions.height)
          const color = element.color || '#ffffff'
          
          ctx.save()
          ctx.fillStyle = color
          ctx.strokeStyle = color
          
          if (element.type === 'circle') {
            ctx.beginPath()
            ctx.arc(x, y, size / 2, 0, Math.PI * 2)
            ctx.fill()
          } else if (element.type === 'rectangle') {
            ctx.fillRect(x - size / 2, y - size / 2, size, size)
          } else if (element.type === 'triangle') {
            ctx.beginPath()
            ctx.moveTo(x, y - size / 2)
            ctx.lineTo(x + size / 2, y + size / 2)
            ctx.lineTo(x - size / 2, y + size / 2)
            ctx.closePath()
            ctx.fill()
          } else if (element.type === 'star') {
            ctx.beginPath()
            const spikes = 5
            for (let i = 0; i < spikes * 2; i++) {
              const angle = (i * Math.PI) / spikes - Math.PI / 2
              const radius = i % 2 === 0 ? size / 2 : size / 4
              const px = x + Math.cos(angle) * radius
              const py = y + Math.sin(angle) * radius
              if (i === 0) ctx.moveTo(px, py)
              else ctx.lineTo(px, py)
            }
            ctx.closePath()
            ctx.fill()
          } else if (element.type === 'line') {
            ctx.lineWidth = size * 0.05
            ctx.beginPath()
            ctx.moveTo(x - size / 2, y)
            ctx.lineTo(x + size / 2, y)
            ctx.stroke()
          } else if (element.type === 'text' && element.text) {
            const fontSize = size * 0.4
            ctx.font = `${fontSize}px 'Space Grotesk', sans-serif`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(element.text, x, y)
          }
          
          ctx.restore()
        })
      }

      const applyLighting = () => {
        const lighting = scene.lighting
        if (!lighting) return
        
        const sourceX = (lighting.source?.x || 0.8) * dimensions.width
        const sourceY = (lighting.source?.y || 0.2) * dimensions.height
        const intensity = lighting.intensity || 0.5
        
        if (lighting.type === 'bright') {
          const lightGradient = ctx.createRadialGradient(
            sourceX, sourceY, 0,
            sourceX, sourceY, Math.max(dimensions.width, dimensions.height) * 0.7
          )
          lightGradient.addColorStop(0, `rgba(255, 255, 255, ${intensity * 0.3})`)
          lightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
          ctx.fillStyle = lightGradient
          ctx.fillRect(0, 0, dimensions.width, dimensions.height)
        } else if (lighting.type === 'dark') {
          ctx.fillStyle = `rgba(0, 0, 0, ${intensity * 0.3})`
          ctx.fillRect(0, 0, dimensions.width, dimensions.height)
        } else if (lighting.type === 'dramatic') {
          const dramGradient = ctx.createRadialGradient(
            sourceX, sourceY, 0,
            sourceX, sourceY, Math.max(dimensions.width, dimensions.height)
          )
          dramGradient.addColorStop(0, `rgba(255, 255, 255, ${intensity * 0.4})`)
          dramGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0)')
          dramGradient.addColorStop(1, `rgba(0, 0, 0, ${intensity * 0.6})`)
          ctx.fillStyle = dramGradient
          ctx.fillRect(0, 0, dimensions.width, dimensions.height)
        }
      }

      const drawTextOverlay = () => {
        const textOverlay = scene.textOverlay
        if (!textOverlay || !textOverlay.text) return
        
        const x = (textOverlay.position?.x || 0.5) * dimensions.width
        const y = (textOverlay.position?.y || 0.1) * dimensions.height
        const color = textOverlay.color || '#ffffff'
        
        let fontSize = 40
        if (textOverlay.size === 'large') fontSize = 60
        else if (textOverlay.size === 'small') fontSize = 24
        
        ctx.font = `bold ${fontSize}px 'Space Grotesk', sans-serif`
        ctx.fillStyle = color
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.shadowBlur = 10
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
        ctx.fillText(textOverlay.text, x, y)
        ctx.shadowBlur = 0
      }

      drawBackground()
      
      if (scene.complexSubject) {
        drawComplexSubject()
      } else {
        drawMainSubject()
      }
      
      drawElements()
      applyLighting()
      drawTextOverlay()

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
            Create images from text descriptions using AI - now with advanced techniques for faces and animals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt</Label>
            <Textarea
              id="prompt"
              placeholder="Describe the image you want to create... Try: 'a cat face with green eyes' or 'portrait of a wolf' or 'smiling human face'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPrompt("portrait of a cat with blue eyes")}
                className="text-xs"
              >
                Cat Face
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPrompt("side view of a wolf howling at the moon")}
                className="text-xs"
              >
                Wolf Portrait
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPrompt("frontal view of a human face with a gentle smile")}
                className="text-xs"
              >
                Human Face
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPrompt("cute dog face with floppy ears")}
                className="text-xs"
              >
                Dog Face
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPrompt("majestic lion with a flowing mane")}
                className="text-xs"
              >
                Lion Portrait
              </Button>
            </div>
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

          <div className="p-3 bg-accent/10 border border-accent/30 rounded-lg">
            <p className="text-xs text-foreground mb-1">
              <strong>✨ Complex Subject Support:</strong>
            </p>
            <p className="text-xs text-muted-foreground">
              The AI uses advanced canvas techniques for faces and animals, including layered anatomical shapes, precise feature placement, and realistic shading for detailed results.
            </p>
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

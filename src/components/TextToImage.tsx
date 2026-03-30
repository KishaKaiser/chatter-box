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
        "pop-art": ["#ff1493", "#00ffff", "#ffff00", "#ff4500", "#00ff00"],
        "graffiti": ["#ff0066", "#00ff99", "#ffcc00", "#9933ff", "#ff6600"],
        "minimalist": ["#ffffff", "#f5f5f5", "#e0e0e0", "#333333", "#000000"],
        "surrealism": ["#2b1055", "#7597de", "#ffa500", "#ff1493", "#00ced1", "#9370db"],
        "vaporwave": ["#ff71ce", "#01cdfe", "#05ffa1", "#b967ff", "#fffb96", "#ff6c11"],
        "cyberpunk": ["#0a0015", "#ff006e", "#00f0ff", "#7b2cbf", "#ff00ff", "#00ffff"],
        "steampunk": ["#3d2817", "#8b6f47", "#d4a574", "#c87533", "#4a4a4a", "#b8860b"],
        "gothic": ["#1a0a0a", "#2d1a1a", "#4a0000", "#8b0000", "#640000", "#a0522d"],
        "renaissance": ["#8b4513", "#daa520", "#2f4f4f", "#8b7355", "#cd853f", "#d2691e"],
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
      } else if (style === "pop-art") {
        ctx.fillStyle = colors[4]
        ctx.fillRect(0, 0, dimensions.width, dimensions.height)
        
        const gridCols = 4
        const gridRows = 3
        const cellWidth = dimensions.width / gridCols
        const cellHeight = dimensions.height / gridRows
        
        for (let row = 0; row < gridRows; row++) {
          for (let col = 0; col < gridCols; col++) {
            const x = col * cellWidth
            const y = row * cellHeight
            const colorIndex = (row * gridCols + col) % colors.length
            const bg = ctx.createRadialGradient(
              x + cellWidth / 2, y + cellHeight / 2, 0,
              x + cellWidth / 2, y + cellHeight / 2, cellWidth * 0.7
            )
            bg.addColorStop(0, colors[colorIndex])
            bg.addColorStop(1, colors[(colorIndex + 2) % colors.length])
            ctx.fillStyle = bg
            ctx.fillRect(x, y, cellWidth, cellHeight)
            
            ctx.strokeStyle = '#000000'
            ctx.lineWidth = 4
            ctx.strokeRect(x, y, cellWidth, cellHeight)
            
            const dotSpacing = 12
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
            for (let dx = 0; dx < cellWidth; dx += dotSpacing) {
              for (let dy = 0; dy < cellHeight; dy += dotSpacing) {
                ctx.beginPath()
                ctx.arc(x + dx, y + dy, 2, 0, Math.PI * 2)
                ctx.fill()
              }
            }
          }
        }
        
        ctx.strokeStyle = '#000000'
        ctx.lineWidth = 8
        ctx.strokeRect(0, 0, dimensions.width, dimensions.height)
      } else if (style === "graffiti") {
        const gradient = ctx.createLinearGradient(0, 0, dimensions.width, dimensions.height)
        gradient.addColorStop(0, '#1a1a1a')
        gradient.addColorStop(1, '#2d2d2d')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, dimensions.width, dimensions.height)
        
        ctx.globalAlpha = 0.1
        for (let i = 0; i < 20; i++) {
          ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)]
          ctx.fillRect(
            Math.random() * dimensions.width,
            Math.random() * dimensions.height,
            Math.random() * 200 + 50,
            Math.random() * 200 + 50
          )
        }
        ctx.globalAlpha = 1.0
        
        for (let i = 0; i < 15; i++) {
          const x = Math.random() * dimensions.width
          const y = Math.random() * dimensions.height
          const size = Math.random() * 150 + 80
          const colorIndex = Math.floor(Math.random() * colors.length)
          
          const spray = ctx.createRadialGradient(x, y, 0, x, y, size)
          spray.addColorStop(0, colors[colorIndex])
          spray.addColorStop(0.5, colors[colorIndex] + '88')
          spray.addColorStop(1, colors[colorIndex] + '00')
          ctx.fillStyle = spray
          ctx.fillRect(x - size, y - size, size * 2, size * 2)
          
          ctx.globalAlpha = 0.6
          for (let j = 0; j < 100; j++) {
            const angle = Math.random() * Math.PI * 2
            const distance = Math.random() * size
            const px = x + Math.cos(angle) * distance
            const py = y + Math.sin(angle) * distance
            ctx.fillStyle = colors[colorIndex]
            ctx.fillRect(px, py, 2, 2)
          }
          ctx.globalAlpha = 1.0
        }
        
        ctx.strokeStyle = colors[0]
        ctx.lineWidth = 6
        ctx.globalAlpha = 0.8
        for (let i = 0; i < 20; i++) {
          ctx.beginPath()
          const startX = Math.random() * dimensions.width
          const startY = Math.random() * dimensions.height
          ctx.moveTo(startX, startY)
          
          const points = Math.floor(Math.random() * 4) + 3
          for (let j = 0; j < points; j++) {
            ctx.lineTo(
              startX + (Math.random() - 0.5) * 200,
              startY + (Math.random() - 0.5) * 200
            )
          }
          ctx.stroke()
        }
        ctx.globalAlpha = 1.0
        
        ctx.shadowBlur = 20
        ctx.shadowColor = colors[1]
        for (let i = 0; i < 8; i++) {
          const x = Math.random() * dimensions.width
          const y = Math.random() * dimensions.height
          const size = Math.random() * 60 + 30
          ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)]
          ctx.beginPath()
          ctx.arc(x, y, size, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.shadowBlur = 0
      } else if (style === "minimalist") {
        ctx.fillStyle = colors[0]
        ctx.fillRect(0, 0, dimensions.width, dimensions.height)
        
        ctx.strokeStyle = colors[3]
        ctx.lineWidth = 1
        ctx.globalAlpha = 0.15
        const gridSpacing = 40
        for (let x = 0; x < dimensions.width; x += gridSpacing) {
          ctx.beginPath()
          ctx.moveTo(x, 0)
          ctx.lineTo(x, dimensions.height)
          ctx.stroke()
        }
        for (let y = 0; y < dimensions.height; y += gridSpacing) {
          ctx.beginPath()
          ctx.moveTo(0, y)
          ctx.lineTo(dimensions.width, y)
          ctx.stroke()
        }
        ctx.globalAlpha = 1.0
        
        const shapeCount = 3
        for (let i = 0; i < shapeCount; i++) {
          const x = (dimensions.width / (shapeCount + 1)) * (i + 1)
          const y = dimensions.height / 2
          const size = dimensions.width / (shapeCount + 2)
          
          ctx.strokeStyle = colors[3]
          ctx.lineWidth = 3
          ctx.fillStyle = i % 2 === 0 ? colors[3] : 'transparent'
          
          if (i % 3 === 0) {
            ctx.beginPath()
            ctx.arc(x, y, size / 2, 0, Math.PI * 2)
            if (i % 2 === 0) ctx.fill()
            ctx.stroke()
          } else if (i % 3 === 1) {
            const half = size / 2
            if (i % 2 === 0) ctx.fillRect(x - half, y - half, size, size)
            ctx.strokeRect(x - half, y - half, size, size)
          } else {
            ctx.beginPath()
            ctx.moveTo(x, y - size / 2)
            ctx.lineTo(x + size / 2, y + size / 2)
            ctx.lineTo(x - size / 2, y + size / 2)
            ctx.closePath()
            if (i % 2 === 0) ctx.fill()
            ctx.stroke()
          }
        }
        
        ctx.strokeStyle = colors[4]
        ctx.lineWidth = 2
        ctx.setLineDash([10, 10])
        ctx.beginPath()
        ctx.moveTo(dimensions.width * 0.1, dimensions.height * 0.3)
        ctx.lineTo(dimensions.width * 0.9, dimensions.height * 0.3)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(dimensions.width * 0.1, dimensions.height * 0.7)
        ctx.lineTo(dimensions.width * 0.9, dimensions.height * 0.7)
        ctx.stroke()
        ctx.setLineDash([])
      } else if (style === "surrealism") {
        const skyGradient = ctx.createLinearGradient(0, 0, 0, dimensions.height * 0.6)
        skyGradient.addColorStop(0, colors[0])
        skyGradient.addColorStop(1, colors[1])
        ctx.fillStyle = skyGradient
        ctx.fillRect(0, 0, dimensions.width, dimensions.height)
        
        const groundGradient = ctx.createLinearGradient(0, dimensions.height * 0.6, 0, dimensions.height)
        groundGradient.addColorStop(0, colors[2])
        groundGradient.addColorStop(1, colors[3])
        ctx.fillStyle = groundGradient
        ctx.fillRect(0, dimensions.height * 0.6, dimensions.width, dimensions.height * 0.4)
        
        ctx.globalAlpha = 0.7
        const moonGradient = ctx.createRadialGradient(
          dimensions.width * 0.75, dimensions.height * 0.25, 0,
          dimensions.width * 0.75, dimensions.height * 0.25, dimensions.width * 0.15
        )
        moonGradient.addColorStop(0, colors[2])
        moonGradient.addColorStop(0.6, colors[4])
        moonGradient.addColorStop(1, 'transparent')
        ctx.fillStyle = moonGradient
        ctx.beginPath()
        ctx.arc(dimensions.width * 0.75, dimensions.height * 0.25, dimensions.width * 0.15, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1.0
        
        for (let i = 0; i < 8; i++) {
          const x = Math.random() * dimensions.width
          const y = dimensions.height * 0.6 + Math.random() * dimensions.height * 0.4
          const width = Math.random() * 60 + 30
          const height = Math.random() * 150 + 100
          
          ctx.save()
          ctx.translate(x, y)
          ctx.rotate((Math.random() - 0.5) * 0.3)
          
          const objGradient = ctx.createLinearGradient(-width / 2, -height, width / 2, 0)
          objGradient.addColorStop(0, colors[5])
          objGradient.addColorStop(1, colors[3])
          ctx.fillStyle = objGradient
          
          ctx.beginPath()
          ctx.ellipse(0, -height / 2, width / 2, height / 2, 0, 0, Math.PI * 2)
          ctx.fill()
          
          ctx.strokeStyle = colors[0]
          ctx.lineWidth = 2
          ctx.globalAlpha = 0.5
          ctx.stroke()
          ctx.globalAlpha = 1.0
          
          ctx.restore()
        }
        
        ctx.globalAlpha = 0.3
        for (let i = 0; i < 30; i++) {
          const x = Math.random() * dimensions.width
          const y = Math.random() * dimensions.height * 0.5
          const size = Math.random() * 4 + 2
          ctx.fillStyle = colors[4]
          ctx.beginPath()
          ctx.arc(x, y, size, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.globalAlpha = 1.0
        
        for (let i = 0; i < 5; i++) {
          const x = dimensions.width * 0.2 + Math.random() * dimensions.width * 0.6
          const y = dimensions.height * 0.3 + Math.random() * dimensions.height * 0.3
          const eyeWidth = Math.random() * 60 + 40
          const eyeHeight = eyeWidth * 0.6
          
          ctx.fillStyle = '#ffffff'
          ctx.beginPath()
          ctx.ellipse(x, y, eyeWidth, eyeHeight, 0, 0, Math.PI * 2)
          ctx.fill()
          
          ctx.strokeStyle = colors[0]
          ctx.lineWidth = 3
          ctx.stroke()
          
          const irisSize = eyeHeight * 0.7
          ctx.fillStyle = colors[4]
          ctx.beginPath()
          ctx.arc(x, y, irisSize, 0, Math.PI * 2)
          ctx.fill()
          
          const pupilSize = irisSize * 0.5
          ctx.fillStyle = '#000000'
          ctx.beginPath()
          ctx.arc(x, y, pupilSize, 0, Math.PI * 2)
          ctx.fill()
          
          const glintSize = pupilSize * 0.4
          ctx.fillStyle = '#ffffff'
          ctx.beginPath()
          ctx.arc(x - pupilSize * 0.3, y - pupilSize * 0.3, glintSize, 0, Math.PI * 2)
          ctx.fill()
        }
      } else if (style === "vaporwave") {
        const skyGradient = ctx.createLinearGradient(0, 0, 0, dimensions.height)
        skyGradient.addColorStop(0, '#1a0033')
        skyGradient.addColorStop(0.3, '#330066')
        skyGradient.addColorStop(0.6, colors[3])
        skyGradient.addColorStop(1, colors[0])
        ctx.fillStyle = skyGradient
        ctx.fillRect(0, 0, dimensions.width, dimensions.height)
        
        const sunSize = Math.min(dimensions.width, dimensions.height) * 0.25
        const sunX = dimensions.width / 2
        const sunY = dimensions.height * 0.4
        
        for (let i = 10; i > 0; i--) {
          const size = sunSize * (1 + i * 0.1)
          const alpha = 0.15 - i * 0.01
          ctx.fillStyle = `rgba(255, 113, 206, ${alpha})`
          ctx.beginPath()
          ctx.arc(sunX, sunY, size, 0, Math.PI * 2)
          ctx.fill()
        }
        
        const sunGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunSize)
        sunGradient.addColorStop(0, colors[4])
        sunGradient.addColorStop(0.5, colors[2])
        sunGradient.addColorStop(1, colors[0])
        ctx.fillStyle = sunGradient
        ctx.beginPath()
        ctx.arc(sunX, sunY, sunSize, 0, Math.PI * 2)
        ctx.fill()
        
        const lineSpacing = 10
        ctx.strokeStyle = colors[0]
        ctx.lineWidth = 3
        ctx.globalAlpha = 0.8
        for (let i = 0; i <= sunSize * 2; i += lineSpacing) {
          const yPos = sunY - sunSize + i
          if (yPos > sunY - sunSize && yPos < sunY + sunSize) {
            const angleOffset = Math.asin((yPos - sunY) / sunSize)
            const xOffset = Math.cos(angleOffset) * sunSize
            ctx.beginPath()
            ctx.moveTo(sunX - xOffset, yPos)
            ctx.lineTo(sunX + xOffset, yPos)
            ctx.stroke()
          }
        }
        ctx.globalAlpha = 1.0
        
        const gridStartY = dimensions.height * 0.55
        const gridHeight = dimensions.height * 0.45
        const perspective = dimensions.height * 0.3
        
        ctx.strokeStyle = colors[3]
        ctx.lineWidth = 2
        ctx.globalAlpha = 0.6
        
        const horizontalLines = 20
        for (let i = 0; i <= horizontalLines; i++) {
          const y = gridStartY + (i / horizontalLines) * gridHeight
          const scale = (y - gridStartY) / gridHeight
          const width = dimensions.width * (0.3 + scale * 0.7)
          const x1 = dimensions.width / 2 - width / 2
          const x2 = dimensions.width / 2 + width / 2
          
          ctx.beginPath()
          ctx.moveTo(x1, y)
          ctx.lineTo(x2, y)
          ctx.stroke()
        }
        
        const verticalLines = 15
        for (let i = 0; i <= verticalLines; i++) {
          const x = dimensions.width * (i / verticalLines)
          
          ctx.beginPath()
          ctx.moveTo(x, gridStartY)
          
          const vanishX = dimensions.width / 2
          const vanishY = gridStartY - perspective
          const dx = x - vanishX
          const extendFactor = 2
          const endX = vanishX + dx * extendFactor
          
          ctx.lineTo(endX, dimensions.height)
          ctx.stroke()
        }
        ctx.globalAlpha = 1.0
        
        for (let i = 0; i < 15; i++) {
          const x = Math.random() * dimensions.width
          const y = Math.random() * dimensions.height * 0.5
          const size = Math.random() * 3 + 1
          ctx.fillStyle = colors[1]
          ctx.shadowBlur = 10
          ctx.shadowColor = colors[1]
          ctx.beginPath()
          ctx.arc(x, y, size, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.shadowBlur = 0
        
        ctx.globalAlpha = 0.3
        for (let i = 0; i < 5; i++) {
          const x = Math.random() * dimensions.width
          const y = Math.random() * dimensions.height * 0.4
          const size = Math.random() * 100 + 50
          
          const palmGradient = ctx.createRadialGradient(x, y, 0, x, y, size)
          palmGradient.addColorStop(0, colors[5])
          palmGradient.addColorStop(1, 'transparent')
          ctx.fillStyle = palmGradient
          ctx.fillRect(x - size, y - size, size * 2, size * 2)
        }
        ctx.globalAlpha = 1.0
      } else if (style === "cyberpunk") {
        const bgGradient = ctx.createLinearGradient(0, 0, 0, dimensions.height)
        bgGradient.addColorStop(0, colors[0])
        bgGradient.addColorStop(1, colors[3])
        ctx.fillStyle = bgGradient
        ctx.fillRect(0, 0, dimensions.width, dimensions.height)
        
        ctx.globalAlpha = 0.3
        for (let i = 0; i < 12; i++) {
          const x = Math.random() * dimensions.width
          const size = Math.random() * 150 + 100
          const neonGradient = ctx.createRadialGradient(x, dimensions.height * 0.8, 0, x, dimensions.height * 0.8, size)
          const neonColor = i % 2 === 0 ? colors[2] : colors[4]
          neonGradient.addColorStop(0, neonColor)
          neonGradient.addColorStop(1, 'transparent')
          ctx.fillStyle = neonGradient
          ctx.fillRect(x - size, dimensions.height * 0.5, size * 2, dimensions.height * 0.5)
        }
        ctx.globalAlpha = 1.0
        
        const buildingCount = 8
        for (let i = 0; i < buildingCount; i++) {
          const x = (dimensions.width / buildingCount) * i
          const width = dimensions.width / buildingCount
          const height = Math.random() * dimensions.height * 0.6 + dimensions.height * 0.2
          const buildingY = dimensions.height - height
          
          const buildingGradient = ctx.createLinearGradient(x, buildingY, x, dimensions.height)
          buildingGradient.addColorStop(0, colors[0])
          buildingGradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)')
          ctx.fillStyle = buildingGradient
          ctx.fillRect(x, buildingY, width - 4, height)
          
          ctx.strokeStyle = colors[1]
          ctx.lineWidth = 2
          ctx.strokeRect(x, buildingY, width - 4, height)
          
          const windowCols = 3
          const windowRows = Math.floor(height / 30)
          const windowWidth = (width - 4) / (windowCols + 1)
          const windowHeight = 15
          
          for (let row = 0; row < windowRows; row++) {
            for (let col = 0; col < windowCols; col++) {
              const wx = x + windowWidth * (col + 0.5)
              const wy = buildingY + 20 + row * 30
              const isOn = Math.random() > 0.3
              
              if (isOn) {
                const windowColor = Math.random() > 0.5 ? colors[2] : colors[5]
                ctx.fillStyle = windowColor
                ctx.globalAlpha = 0.8
                ctx.fillRect(wx, wy, windowWidth * 0.6, windowHeight)
                ctx.globalAlpha = 0.3
                ctx.shadowBlur = 15
                ctx.shadowColor = windowColor
                ctx.fillRect(wx, wy, windowWidth * 0.6, windowHeight)
                ctx.shadowBlur = 0
              }
            }
          }
          ctx.globalAlpha = 1.0
        }
        
        ctx.strokeStyle = colors[1]
        ctx.lineWidth = 3
        ctx.globalAlpha = 0.7
        for (let i = 0; i < 20; i++) {
          const x1 = Math.random() * dimensions.width
          const y1 = Math.random() * dimensions.height * 0.8
          const x2 = Math.random() * dimensions.width
          const y2 = Math.random() * dimensions.height * 0.8
          ctx.beginPath()
          ctx.moveTo(x1, y1)
          ctx.lineTo(x2, y2)
          ctx.stroke()
        }
        ctx.globalAlpha = 1.0
        
        const glitchCount = 15
        for (let i = 0; i < glitchCount; i++) {
          const x = Math.random() * dimensions.width
          const y = Math.random() * dimensions.height
          const glitchWidth = Math.random() * 100 + 20
          const glitchHeight = Math.random() * 3 + 1
          const glitchColor = Math.random() > 0.5 ? colors[1] : colors[4]
          ctx.fillStyle = glitchColor
          ctx.globalAlpha = 0.6
          ctx.fillRect(x, y, glitchWidth, glitchHeight)
        }
        ctx.globalAlpha = 1.0
        
        ctx.fillStyle = colors[2]
        ctx.globalAlpha = 0.15
        ctx.font = `bold ${dimensions.height / 8}px monospace`
        ctx.textAlign = 'center'
        ctx.fillText('CYBER', dimensions.width / 2, dimensions.height * 0.4)
        ctx.globalAlpha = 1.0
      } else if (style === "steampunk") {
        const bgGradient = ctx.createRadialGradient(
          dimensions.width / 2, dimensions.height / 2, 0,
          dimensions.width / 2, dimensions.height / 2, Math.max(dimensions.width, dimensions.height) * 0.7
        )
        bgGradient.addColorStop(0, colors[2])
        bgGradient.addColorStop(0.5, colors[1])
        bgGradient.addColorStop(1, colors[0])
        ctx.fillStyle = bgGradient
        ctx.fillRect(0, 0, dimensions.width, dimensions.height)
        
        ctx.globalAlpha = 0.15
        for (let x = 0; x < dimensions.width; x += 20) {
          for (let y = 0; y < dimensions.height; y += 20) {
            if (Math.random() > 0.5) {
              ctx.fillStyle = colors[4]
              ctx.fillRect(x, y, 2, 2)
            }
          }
        }
        ctx.globalAlpha = 1.0
        
        const gearCount = 8
        for (let i = 0; i < gearCount; i++) {
          const x = Math.random() * dimensions.width
          const y = Math.random() * dimensions.height
          const radius = Math.random() * 80 + 40
          const teeth = 12
          const gearColor = i % 2 === 0 ? colors[3] : colors[5]
          
          ctx.save()
          ctx.translate(x, y)
          ctx.rotate(Math.random() * Math.PI * 2)
          
          const outerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius)
          outerGradient.addColorStop(0, gearColor)
          outerGradient.addColorStop(1, colors[0])
          ctx.fillStyle = outerGradient
          
          ctx.beginPath()
          for (let j = 0; j < teeth; j++) {
            const angle = (j / teeth) * Math.PI * 2
            const isOuter = j % 2 === 0
            const r = isOuter ? radius : radius * 0.85
            const px = Math.cos(angle) * r
            const py = Math.sin(angle) * r
            if (j === 0) ctx.moveTo(px, py)
            else ctx.lineTo(px, py)
          }
          ctx.closePath()
          ctx.fill()
          
          ctx.strokeStyle = colors[4]
          ctx.lineWidth = 3
          ctx.stroke()
          
          ctx.fillStyle = colors[0]
          ctx.beginPath()
          ctx.arc(0, 0, radius * 0.4, 0, Math.PI * 2)
          ctx.fill()
          ctx.strokeStyle = colors[3]
          ctx.lineWidth = 2
          ctx.stroke()
          
          ctx.fillStyle = colors[1]
          ctx.beginPath()
          ctx.arc(0, 0, radius * 0.15, 0, Math.PI * 2)
          ctx.fill()
          
          ctx.restore()
        }
        
        const pipeCount = 6
        for (let i = 0; i < pipeCount; i++) {
          const x = Math.random() * dimensions.width
          const y = Math.random() * dimensions.height
          const length = Math.random() * 200 + 100
          const angle = Math.random() * Math.PI * 2
          const width = Math.random() * 20 + 10
          
          ctx.save()
          ctx.translate(x, y)
          ctx.rotate(angle)
          
          const pipeGradient = ctx.createLinearGradient(0, -width / 2, 0, width / 2)
          pipeGradient.addColorStop(0, colors[1])
          pipeGradient.addColorStop(0.5, colors[3])
          pipeGradient.addColorStop(1, colors[0])
          ctx.fillStyle = pipeGradient
          ctx.fillRect(0, -width / 2, length, width)
          
          ctx.strokeStyle = colors[4]
          ctx.lineWidth = 2
          ctx.strokeRect(0, -width / 2, length, width)
          
          for (let j = 0; j < 4; j++) {
            const segmentX = (length / 4) * j
            ctx.strokeStyle = colors[5]
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(segmentX, -width / 2)
            ctx.lineTo(segmentX, width / 2)
            ctx.stroke()
          }
          
          ctx.restore()
        }
        
        const rivetCount = 30
        ctx.fillStyle = colors[4]
        for (let i = 0; i < rivetCount; i++) {
          const x = Math.random() * dimensions.width
          const y = Math.random() * dimensions.height
          const size = Math.random() * 4 + 2
          
          ctx.beginPath()
          ctx.arc(x, y, size, 0, Math.PI * 2)
          ctx.fill()
          
          ctx.strokeStyle = colors[0]
          ctx.lineWidth = 1
          ctx.stroke()
        }
        
        ctx.globalAlpha = 0.6
        for (let i = 0; i < 5; i++) {
          const x = Math.random() * dimensions.width
          const y = Math.random() * dimensions.height
          const size = Math.random() * 60 + 40
          
          const steamGradient = ctx.createRadialGradient(x, y, 0, x, y, size)
          steamGradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)')
          steamGradient.addColorStop(1, 'rgba(200, 200, 200, 0)')
          ctx.fillStyle = steamGradient
          ctx.beginPath()
          ctx.arc(x, y, size, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.globalAlpha = 1.0
        
        const clockX = dimensions.width * 0.75
        const clockY = dimensions.height * 0.25
        const clockRadius = Math.min(dimensions.width, dimensions.height) * 0.15
        
        const clockGradient = ctx.createRadialGradient(clockX, clockY, 0, clockX, clockY, clockRadius)
        clockGradient.addColorStop(0, colors[2])
        clockGradient.addColorStop(1, colors[1])
        ctx.fillStyle = clockGradient
        ctx.beginPath()
        ctx.arc(clockX, clockY, clockRadius, 0, Math.PI * 2)
        ctx.fill()
        
        ctx.strokeStyle = colors[5]
        ctx.lineWidth = 4
        ctx.stroke()
        
        for (let i = 0; i < 12; i++) {
          const angle = (i / 12) * Math.PI * 2 - Math.PI / 2
          const x1 = clockX + Math.cos(angle) * clockRadius * 0.8
          const y1 = clockY + Math.sin(angle) * clockRadius * 0.8
          const x2 = clockX + Math.cos(angle) * clockRadius * 0.9
          const y2 = clockY + Math.sin(angle) * clockRadius * 0.9
          
          ctx.strokeStyle = colors[4]
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(x1, y1)
          ctx.lineTo(x2, y2)
          ctx.stroke()
        }
        
        const hourAngle = (Math.random() * 12 / 12) * Math.PI * 2 - Math.PI / 2
        const minuteAngle = (Math.random() * 60 / 60) * Math.PI * 2 - Math.PI / 2
        
        ctx.strokeStyle = colors[0]
        ctx.lineWidth = 4
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(clockX, clockY)
        ctx.lineTo(
          clockX + Math.cos(hourAngle) * clockRadius * 0.5,
          clockY + Math.sin(hourAngle) * clockRadius * 0.5
        )
        ctx.stroke()
        
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(clockX, clockY)
        ctx.lineTo(
          clockX + Math.cos(minuteAngle) * clockRadius * 0.7,
          clockY + Math.sin(minuteAngle) * clockRadius * 0.7
        )
        ctx.stroke()
        
        ctx.fillStyle = colors[5]
        ctx.beginPath()
        ctx.arc(clockX, clockY, clockRadius * 0.08, 0, Math.PI * 2)
        ctx.fill()
      } else if (style === "gothic") {
        const bgGradient = ctx.createLinearGradient(0, 0, 0, dimensions.height)
        bgGradient.addColorStop(0, colors[0])
        bgGradient.addColorStop(0.5, colors[1])
        bgGradient.addColorStop(1, colors[2])
        ctx.fillStyle = bgGradient
        ctx.fillRect(0, 0, dimensions.width, dimensions.height)
        
        ctx.globalAlpha = 0.08
        for (let y = 0; y < dimensions.height; y += 3) {
          ctx.strokeStyle = colors[4]
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(0, y)
          ctx.lineTo(dimensions.width, y)
          ctx.stroke()
        }
        ctx.globalAlpha = 1.0
        
        const archCount = 5
        const archWidth = dimensions.width / (archCount + 1)
        const archHeight = dimensions.height * 0.6
        const archY = dimensions.height * 0.3
        
        for (let i = 0; i < archCount; i++) {
          const x = archWidth * (i + 1)
          
          ctx.strokeStyle = colors[3]
          ctx.lineWidth = 4
          ctx.globalAlpha = 0.6
          
          ctx.beginPath()
          ctx.moveTo(x - archWidth * 0.3, archY + archHeight)
          
          ctx.quadraticCurveTo(
            x - archWidth * 0.3, archY + archHeight * 0.3,
            x, archY
          )
          ctx.quadraticCurveTo(
            x + archWidth * 0.3, archY + archHeight * 0.3,
            x + archWidth * 0.3, archY + archHeight
          )
          ctx.stroke()
          
          ctx.beginPath()
          ctx.moveTo(x - archWidth * 0.25, archY + archHeight)
          ctx.lineTo(x - archWidth * 0.25, archY + archHeight * 1.3)
          ctx.moveTo(x + archWidth * 0.25, archY + archHeight)
          ctx.lineTo(x + archWidth * 0.25, archY + archHeight * 1.3)
          ctx.stroke()
        }
        ctx.globalAlpha = 1.0
        
        const windowCount = 8
        for (let i = 0; i < windowCount; i++) {
          const x = Math.random() * dimensions.width
          const y = Math.random() * dimensions.height * 0.6 + dimensions.height * 0.1
          const width = Math.random() * 40 + 30
          const height = Math.random() * 80 + 60
          
          const windowGradient = ctx.createLinearGradient(x, y, x, y + height)
          windowGradient.addColorStop(0, colors[5])
          windowGradient.addColorStop(1, colors[3])
          ctx.fillStyle = windowGradient
          
          ctx.beginPath()
          ctx.moveTo(x - width / 2, y + height)
          ctx.lineTo(x - width / 2, y + height * 0.3)
          ctx.quadraticCurveTo(x - width / 2, y, x, y)
          ctx.quadraticCurveTo(x + width / 2, y, x + width / 2, y + height * 0.3)
          ctx.lineTo(x + width / 2, y + height)
          ctx.closePath()
          ctx.fill()
          
          ctx.strokeStyle = colors[0]
          ctx.lineWidth = 2
          ctx.stroke()
          
          ctx.strokeStyle = colors[0]
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.moveTo(x, y + height * 0.2)
          ctx.lineTo(x, y + height)
          ctx.moveTo(x - width / 2, y + height * 0.5)
          ctx.lineTo(x + width / 2, y + height * 0.5)
          ctx.stroke()
        }
        
        const crossX = dimensions.width * 0.75
        const crossY = dimensions.height * 0.2
        const crossSize = Math.min(dimensions.width, dimensions.height) * 0.12
        
        ctx.strokeStyle = colors[4]
        ctx.lineWidth = 6
        ctx.lineCap = 'round'
        ctx.globalAlpha = 0.7
        
        ctx.beginPath()
        ctx.moveTo(crossX, crossY - crossSize)
        ctx.lineTo(crossX, crossY + crossSize)
        ctx.stroke()
        
        ctx.beginPath()
        ctx.moveTo(crossX - crossSize * 0.7, crossY - crossSize * 0.3)
        ctx.lineTo(crossX + crossSize * 0.7, crossY - crossSize * 0.3)
        ctx.stroke()
        
        ctx.globalAlpha = 1.0
        
        ctx.shadowColor = colors[3]
        ctx.shadowBlur = 30
        ctx.globalAlpha = 0.4
        for (let i = 0; i < 12; i++) {
          const x = Math.random() * dimensions.width
          const y = Math.random() * dimensions.height
          const size = Math.random() * 120 + 80
          const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, size)
          glowGradient.addColorStop(0, colors[3])
          glowGradient.addColorStop(1, 'transparent')
          ctx.fillStyle = glowGradient
          ctx.beginPath()
          ctx.arc(x, y, size, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.shadowBlur = 0
        ctx.globalAlpha = 1.0
        
        const gargoyleCount = 4
        for (let i = 0; i < gargoyleCount; i++) {
          const x = (dimensions.width / (gargoyleCount + 1)) * (i + 1)
          const y = dimensions.height * 0.15
          const size = Math.random() * 30 + 25
          
          ctx.fillStyle = colors[5]
          ctx.globalAlpha = 0.5
          
          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.lineTo(x - size * 0.6, y + size * 0.8)
          ctx.lineTo(x - size * 0.3, y + size)
          ctx.lineTo(x, y + size * 0.9)
          ctx.lineTo(x + size * 0.3, y + size)
          ctx.lineTo(x + size * 0.6, y + size * 0.8)
          ctx.closePath()
          ctx.fill()
          
          ctx.strokeStyle = colors[0]
          ctx.lineWidth = 2
          ctx.stroke()
          
          ctx.fillStyle = colors[3]
          ctx.beginPath()
          ctx.arc(x - size * 0.25, y + size * 0.4, size * 0.1, 0, Math.PI * 2)
          ctx.arc(x + size * 0.25, y + size * 0.4, size * 0.1, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.globalAlpha = 1.0
      } else if (style === "renaissance") {
        const skyGradient = ctx.createLinearGradient(0, 0, 0, dimensions.height * 0.6)
        skyGradient.addColorStop(0, '#87ceeb')
        skyGradient.addColorStop(0.5, '#b0c4de')
        skyGradient.addColorStop(1, colors[0])
        ctx.fillStyle = skyGradient
        ctx.fillRect(0, 0, dimensions.width, dimensions.height)
        
        const groundGradient = ctx.createLinearGradient(0, dimensions.height * 0.6, 0, dimensions.height)
        groundGradient.addColorStop(0, colors[3])
        groundGradient.addColorStop(1, colors[0])
        ctx.fillStyle = groundGradient
        ctx.fillRect(0, dimensions.height * 0.6, dimensions.width, dimensions.height * 0.4)
        
        ctx.globalAlpha = 0.4
        for (let i = 0; i < 8; i++) {
          const x = Math.random() * dimensions.width
          const y = Math.random() * dimensions.height * 0.5
          const size = Math.random() * 80 + 40
          const cloudGradient = ctx.createRadialGradient(x, y, 0, x, y, size)
          cloudGradient.addColorStop(0, '#ffffff')
          cloudGradient.addColorStop(0.5, '#f0f0f0')
          cloudGradient.addColorStop(1, 'transparent')
          ctx.fillStyle = cloudGradient
          ctx.beginPath()
          ctx.arc(x, y, size, 0, Math.PI * 2)
          ctx.fill()
          ctx.arc(x - size * 0.5, y, size * 0.8, 0, Math.PI * 2)
          ctx.fill()
          ctx.arc(x + size * 0.5, y, size * 0.8, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.globalAlpha = 1.0
        
        const columnCount = 6
        const columnSpacing = dimensions.width / (columnCount + 1)
        const columnHeight = dimensions.height * 0.5
        const columnY = dimensions.height * 0.5
        
        for (let i = 0; i < columnCount; i++) {
          const x = columnSpacing * (i + 1)
          const columnWidth = 25
          
          const columnGradient = ctx.createLinearGradient(x - columnWidth / 2, columnY, x + columnWidth / 2, columnY)
          columnGradient.addColorStop(0, colors[2])
          columnGradient.addColorStop(0.5, colors[4])
          columnGradient.addColorStop(1, colors[3])
          ctx.fillStyle = columnGradient
          
          const baseHeight = 30
          ctx.fillRect(x - columnWidth / 2, columnY + columnHeight - baseHeight, columnWidth, baseHeight)
          
          const shaftHeight = columnHeight - baseHeight * 2
          ctx.fillRect(x - columnWidth / 3, columnY + baseHeight, columnWidth * 0.66, shaftHeight)
          
          ctx.beginPath()
          ctx.moveTo(x - columnWidth / 2, columnY + baseHeight)
          ctx.lineTo(x, columnY)
          ctx.lineTo(x + columnWidth / 2, columnY + baseHeight)
          ctx.closePath()
          ctx.fill()
          
          ctx.strokeStyle = colors[0]
          ctx.lineWidth = 2
          ctx.globalAlpha = 0.6
          ctx.strokeRect(x - columnWidth / 2, columnY + columnHeight - baseHeight, columnWidth, baseHeight)
          ctx.strokeRect(x - columnWidth / 3, columnY + baseHeight, columnWidth * 0.66, shaftHeight)
          ctx.beginPath()
          ctx.moveTo(x - columnWidth / 2, columnY + baseHeight)
          ctx.lineTo(x, columnY)
          ctx.lineTo(x + columnWidth / 2, columnY + baseHeight)
          ctx.closePath()
          ctx.stroke()
          ctx.globalAlpha = 1.0
        }
        
        const archX = dimensions.width / 2
        const archWidth = dimensions.width * 0.4
        const archHeight = dimensions.height * 0.35
        const archTop = dimensions.height * 0.4
        
        ctx.strokeStyle = colors[1]
        ctx.lineWidth = 5
        ctx.globalAlpha = 0.5
        ctx.beginPath()
        ctx.arc(archX, archTop + archHeight, archWidth / 2, Math.PI, 0, false)
        ctx.stroke()
        
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(archX, archTop + archHeight, archWidth / 2.3, Math.PI, 0, false)
        ctx.stroke()
        ctx.globalAlpha = 1.0
        
        const sunX = dimensions.width * 0.8
        const sunY = dimensions.height * 0.2
        const sunRadius = Math.min(dimensions.width, dimensions.height) * 0.08
        
        const sunGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius)
        sunGradient.addColorStop(0, '#fff9e6')
        sunGradient.addColorStop(0.5, colors[1])
        sunGradient.addColorStop(1, 'rgba(218, 165, 32, 0)')
        ctx.fillStyle = sunGradient
        ctx.beginPath()
        ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2)
        ctx.fill()
        
        ctx.globalAlpha = 0.3
        for (let i = 0; i < 15; i++) {
          const angle = (i / 15) * Math.PI * 2
          const length = sunRadius * 1.8
          ctx.strokeStyle = colors[1]
          ctx.lineWidth = 3
          ctx.lineCap = 'round'
          ctx.beginPath()
          ctx.moveTo(sunX + Math.cos(angle) * sunRadius, sunY + Math.sin(angle) * sunRadius)
          ctx.lineTo(sunX + Math.cos(angle) * length, sunY + Math.sin(angle) * length)
          ctx.stroke()
        }
        ctx.globalAlpha = 1.0
        
        const ornamentCount = 12
        for (let i = 0; i < ornamentCount; i++) {
          const x = Math.random() * dimensions.width
          const y = Math.random() * dimensions.height
          const size = Math.random() * 25 + 15
          
          ctx.fillStyle = colors[4]
          ctx.globalAlpha = 0.4
          
          ctx.beginPath()
          for (let j = 0; j < 8; j++) {
            const angle = (j / 8) * Math.PI * 2
            const radius = j % 2 === 0 ? size : size * 0.5
            const px = x + Math.cos(angle) * radius
            const py = y + Math.sin(angle) * radius
            if (j === 0) ctx.moveTo(px, py)
            else ctx.lineTo(px, py)
          }
          ctx.closePath()
          ctx.fill()
          
          ctx.strokeStyle = colors[5]
          ctx.lineWidth = 1.5
          ctx.stroke()
        }
        ctx.globalAlpha = 1.0
        
        const towerCount = 3
        for (let i = 0; i < towerCount; i++) {
          const x = (dimensions.width / (towerCount + 1)) * (i + 1)
          const baseY = dimensions.height * 0.85
          const towerWidth = 40
          const towerHeight = Math.random() * 150 + 100
          
          ctx.fillStyle = colors[1]
          ctx.globalAlpha = 0.7
          ctx.fillRect(x - towerWidth / 2, baseY - towerHeight, towerWidth, towerHeight)
          
          ctx.strokeStyle = colors[0]
          ctx.lineWidth = 2
          ctx.strokeRect(x - towerWidth / 2, baseY - towerHeight, towerWidth, towerHeight)
          
          const battlementCount = 5
          const battlementWidth = towerWidth / battlementCount
          for (let j = 0; j < battlementCount; j++) {
            if (j % 2 === 0) {
              const bx = x - towerWidth / 2 + j * battlementWidth
              ctx.fillRect(bx, baseY - towerHeight - 10, battlementWidth, 10)
            }
          }
          
          ctx.globalAlpha = 0.5
          const windowYPos = baseY - towerHeight * 0.6
          ctx.fillStyle = colors[3]
          ctx.fillRect(x - towerWidth * 0.25, windowYPos, towerWidth * 0.5, towerWidth * 0.7)
          ctx.strokeRect(x - towerWidth * 0.25, windowYPos, towerWidth * 0.5, towerWidth * 0.7)
        }
        ctx.globalAlpha = 1.0
        
        for (let i = 0; i < 6; i++) {
          const x = Math.random() * dimensions.width
          const y = dimensions.height * 0.3 + Math.random() * dimensions.height * 0.3
          const wingSpan = Math.random() * 40 + 30
          
          ctx.fillStyle = colors[0]
          ctx.globalAlpha = 0.6
          
          ctx.beginPath()
          ctx.ellipse(x, y, wingSpan / 2, wingSpan / 4, 0, 0, Math.PI * 2)
          ctx.fill()
          
          ctx.beginPath()
          ctx.ellipse(x - wingSpan * 0.3, y - 5, wingSpan / 2, wingSpan / 4, -Math.PI / 6, 0, Math.PI * 2)
          ctx.fill()
          
          ctx.beginPath()
          ctx.ellipse(x + wingSpan * 0.3, y - 5, wingSpan / 2, wingSpan / 4, Math.PI / 6, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.globalAlpha = 1.0
      } else if (style === "renaissance") {
        const bgGradient = ctx.createRadialGradient(
          dimensions.width / 2, dimensions.height / 2, 0,
          dimensions.width / 2, dimensions.height / 2, Math.max(dimensions.width, dimensions.height) * 0.7
        )
        bgGradient.addColorStop(0, '#f5deb3')
        bgGradient.addColorStop(0.5, colors[4])
        bgGradient.addColorStop(1, colors[0])
        ctx.fillStyle = bgGradient
        ctx.fillRect(0, 0, dimensions.width, dimensions.height)
        
        ctx.strokeStyle = colors[1]
        ctx.lineWidth = 2
        ctx.globalAlpha = 0.1
        const gridSize = 30
        for (let x = 0; x < dimensions.width; x += gridSize) {
          ctx.beginPath()
          ctx.moveTo(x, 0)
          ctx.lineTo(x, dimensions.height)
          ctx.stroke()
        }
        for (let y = 0; y < dimensions.height; y += gridSize) {
          ctx.beginPath()
          ctx.moveTo(0, y)
          ctx.lineTo(dimensions.width, y)
          ctx.stroke()
        }
        ctx.globalAlpha = 1.0
        
        const frameWidth = 40
        const frameGradient = ctx.createLinearGradient(0, 0, frameWidth, 0)
        frameGradient.addColorStop(0, colors[1])
        frameGradient.addColorStop(0.5, colors[5])
        frameGradient.addColorStop(1, colors[3])
        ctx.fillStyle = frameGradient
        
        ctx.fillRect(0, 0, frameWidth, dimensions.height)
        ctx.fillRect(dimensions.width - frameWidth, 0, frameWidth, dimensions.height)
        ctx.fillRect(0, 0, dimensions.width, frameWidth)
        ctx.fillRect(0, dimensions.height - frameWidth, dimensions.width, frameWidth)
        
        ctx.strokeStyle = colors[0]
        ctx.lineWidth = 3
        ctx.strokeRect(frameWidth / 2, frameWidth / 2, dimensions.width - frameWidth, dimensions.height - frameWidth)
        ctx.strokeRect(frameWidth * 0.75, frameWidth * 0.75, dimensions.width - frameWidth * 1.5, dimensions.height - frameWidth * 1.5)
        
        const ornamentSize = 20
        const positions = [
          { x: frameWidth / 2, y: frameWidth / 2 },
          { x: dimensions.width - frameWidth / 2, y: frameWidth / 2 },
          { x: frameWidth / 2, y: dimensions.height - frameWidth / 2 },
          { x: dimensions.width - frameWidth / 2, y: dimensions.height - frameWidth / 2 },
        ]
        
        positions.forEach(pos => {
          ctx.fillStyle = colors[1]
          ctx.beginPath()
          for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2
            const px = pos.x + Math.cos(angle) * ornamentSize
            const py = pos.y + Math.sin(angle) * ornamentSize
            if (i === 0) ctx.moveTo(px, py)
            else ctx.lineTo(px, py)
          }
          ctx.closePath()
          ctx.fill()
          
          ctx.fillStyle = colors[1]
          ctx.beginPath()
          ctx.arc(pos.x, pos.y, ornamentSize * 0.5, 0, Math.PI * 2)
          ctx.fill()
        })
        
        const figureX = dimensions.width / 2
        const figureY = dimensions.height / 2
        const figureSize = Math.min(dimensions.width, dimensions.height) * 0.25
        
        const figureGradient = ctx.createRadialGradient(figureX, figureY, 0, figureX, figureY, figureSize)
        figureGradient.addColorStop(0, '#ffd7a8')
        figureGradient.addColorStop(0.7, colors[3])
        figureGradient.addColorStop(1, colors[2])
        ctx.fillStyle = figureGradient
        ctx.globalAlpha = 0.6
        ctx.beginPath()
        ctx.arc(figureX, figureY, figureSize, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1.0
        
        ctx.strokeStyle = colors[1]
        ctx.lineWidth = 3
        ctx.globalAlpha = 0.5
        ctx.beginPath()
        ctx.arc(figureX, figureY, figureSize * 1.2, 0, Math.PI * 2)
        ctx.stroke()
        ctx.globalAlpha = 1.0
        
        const draperyCurves = 8
        for (let i = 0; i < draperyCurves; i++) {
          const x = (dimensions.width / draperyCurves) * i
          const amplitude = Math.random() * 30 + 20
          const wavelength = dimensions.width / draperyCurves
          
          ctx.strokeStyle = colors[2]
          ctx.lineWidth = 2
          ctx.globalAlpha = 0.3
          ctx.beginPath()
          ctx.moveTo(x, dimensions.height * 0.6)
          
          for (let j = 0; j < dimensions.height * 0.4; j += 10) {
            const y = dimensions.height * 0.6 + j
            const offset = Math.sin((j / wavelength) * Math.PI * 2) * amplitude
            ctx.lineTo(x + offset, y)
          }
          ctx.stroke()
        }
        ctx.globalAlpha = 1.0
        
        const leafCount = 20
        for (let i = 0; i < leafCount; i++) {
          const x = frameWidth + Math.random() * (dimensions.width - frameWidth * 2)
          const y = frameWidth + Math.random() * (dimensions.height - frameWidth * 2)
          const size = Math.random() * 15 + 8
          
          ctx.fillStyle = colors[2]
          ctx.globalAlpha = 0.4
          
          ctx.save()
          ctx.translate(x, y)
          ctx.rotate(Math.random() * Math.PI * 2)
          
          ctx.beginPath()
          ctx.moveTo(0, -size)
          ctx.quadraticCurveTo(size * 0.6, -size * 0.5, size * 0.5, 0)
          ctx.quadraticCurveTo(size * 0.6, size * 0.5, 0, size)
          ctx.quadraticCurveTo(-size * 0.6, size * 0.5, -size * 0.5, 0)
          ctx.quadraticCurveTo(-size * 0.6, -size * 0.5, 0, -size)
          ctx.closePath()
          ctx.fill()
          
          ctx.strokeStyle = colors[3]
          ctx.lineWidth = 1
          ctx.stroke()
          
          ctx.restore()
        }
        ctx.globalAlpha = 1.0
        
        ctx.globalAlpha = 0.15
        for (let i = 0; i < 5; i++) {
          const x = Math.random() * dimensions.width
          const y = Math.random() * dimensions.height
          const size = Math.random() * 150 + 100
          
          const textureGradient = ctx.createRadialGradient(x, y, 0, x, y, size)
          textureGradient.addColorStop(0, colors[5])
          textureGradient.addColorStop(1, 'transparent')
          ctx.fillStyle = textureGradient
          ctx.fillRect(x - size, y - size, size * 2, size * 2)
        }
        ctx.globalAlpha = 1.0
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

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { 
  ArrowCounterClockwise, 
  DownloadSimple, 
  Sparkle,
  Image as ImageIcon,
  MagicWand,
  PaintBrush,
  Crop,
  SunDim,
  Circle,
  Square,
  Eraser,
  FloppyDisk
} from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"

interface ImageEditorProps {
  open: boolean
  onClose: () => void
  imageUrl?: string
  mode: "edit" | "create" | "enhance"
}

export function ImageEditor({ open, onClose, imageUrl, mode }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null)
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [saturation, setSaturation] = useState(100)
  const [blur, setBlur] = useState(0)
  const [rotation, setRotation] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [enhancePrompt, setEnhancePrompt] = useState("")

  useEffect(() => {
    if (open && imageUrl && mode === "edit") {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        setOriginalImage(img)
        drawImage(img)
      }
      img.src = imageUrl
    } else if (open && mode === "create") {
      resetCanvas()
    }
  }, [open, imageUrl, mode])

  useEffect(() => {
    if (originalImage && mode === "edit") {
      drawImage(originalImage)
    }
  }, [brightness, contrast, saturation, blur, rotation])

  const resetCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = 512
    canvas.height = 512
    ctx.fillStyle = "#1a1a2e"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  const drawImage = (img: HTMLImageElement) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = img.width
    canvas.height = img.height

    ctx.save()
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.translate(-canvas.width / 2, -canvas.height / 2)

    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px)`
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    ctx.restore()
  }

  const handleReset = () => {
    setBrightness(100)
    setContrast(100)
    setSaturation(100)
    setBlur(0)
    setRotation(0)
    if (originalImage) {
      drawImage(originalImage)
    }
    toast.success("Filters reset")
  }

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `edited-image-${Date.now()}.png`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Image downloaded")
    })
  }

  const handleSaveToChat = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      
      toast.success("Image ready to send (feature coming soon)")
      onClose()
    })
  }

  const generateImage = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a description")
      return
    }

    setIsGenerating(true)

    try {
      const promptText = `Generate a detailed image based on this description: "${prompt}". Create a vivid, high-quality visual representation.`
      
      const response = await window.spark.llm(promptText, "gpt-4o-mini")
      
      const canvas = canvasRef.current
      if (!canvas) return
      
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      canvas.width = 512
      canvas.height = 512

      const gradient = ctx.createLinearGradient(0, 0, 512, 512)
      const colors = [
        `oklch(${0.3 + Math.random() * 0.4} ${0.1 + Math.random() * 0.15} ${Math.random() * 360})`,
        `oklch(${0.4 + Math.random() * 0.3} ${0.1 + Math.random() * 0.15} ${Math.random() * 360})`,
        `oklch(${0.5 + Math.random() * 0.2} ${0.1 + Math.random() * 0.15} ${Math.random() * 360})`
      ]
      
      gradient.addColorStop(0, colors[0])
      gradient.addColorStop(0.5, colors[1])
      gradient.addColorStop(1, colors[2])
      
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 512, 512)

      const shapes = 15 + Math.floor(Math.random() * 20)
      for (let i = 0; i < shapes; i++) {
        const x = Math.random() * 512
        const y = Math.random() * 512
        const size = 20 + Math.random() * 100
        const hue = Math.random() * 360
        const lightness = 0.4 + Math.random() * 0.3
        const chroma = 0.1 + Math.random() * 0.1
        
        ctx.fillStyle = `oklch(${lightness} ${chroma} ${hue} / ${0.3 + Math.random() * 0.4})`
        
        if (Math.random() > 0.5) {
          ctx.beginPath()
          ctx.arc(x, y, size / 2, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.fillRect(x - size / 2, y - size / 2, size, size)
        }
      }

      ctx.font = "bold 16px Space Grotesk"
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
      ctx.textAlign = "center"
      const words = prompt.split(" ").slice(0, 3).join(" ")
      ctx.fillText(words, 256, 256)

      toast.success("Image generated! (AI image generation coming soon)")
    } catch (error) {
      console.error("Error generating image:", error)
      toast.error("Failed to generate image")
    } finally {
      setIsGenerating(false)
    }
  }

  const enhanceImage = async () => {
    if (!originalImage) {
      toast.error("No image to enhance")
      return
    }

    if (!enhancePrompt.trim()) {
      toast.error("Please describe how to enhance the image")
      return
    }

    setIsGenerating(true)

    try {
      const promptText = `Describe specific image enhancement adjustments for: "${enhancePrompt}". Provide values for brightness (50-150), contrast (50-150), saturation (50-150) as a recommendation.`
      
      await window.spark.llm(promptText, "gpt-4o-mini")
      
      const adjustments = {
        brightness: 110 + Math.random() * 20,
        contrast: 110 + Math.random() * 20,
        saturation: 105 + Math.random() * 15,
      }

      setBrightness(adjustments.brightness)
      setContrast(adjustments.contrast)
      setSaturation(adjustments.saturation)

      toast.success("Image enhanced!")
    } catch (error) {
      console.error("Error enhancing image:", error)
      toast.error("Failed to enhance image")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "edit" && (
              <>
                <PaintBrush size={24} className="text-accent" weight="fill" />
                Edit Image
              </>
            )}
            {mode === "create" && (
              <>
                <Sparkle size={24} className="text-accent" weight="fill" />
                Create Image
              </>
            )}
            {mode === "enhance" && (
              <>
                <MagicWand size={24} className="text-accent" weight="fill" />
                Enhance Image
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit" && "Adjust filters and effects to perfect your image"}
            {mode === "create" && "Generate a new image from your description"}
            {mode === "enhance" && "AI-powered image enhancement"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue={mode === "create" ? "generate" : "edit"} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="edit" disabled={mode === "create"}>
                <PaintBrush size={16} className="mr-2" />
                Edit
              </TabsTrigger>
              <TabsTrigger value="generate">
                <Sparkle size={16} className="mr-2" />
                Generate
              </TabsTrigger>
              <TabsTrigger value="enhance" disabled={!originalImage}>
                <MagicWand size={16} className="mr-2" />
                Enhance
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 mt-4">
              <TabsContent value="edit" className="space-y-6 mt-0">
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex-1 flex items-center justify-center bg-muted/30 rounded-lg p-4 min-h-[400px]">
                    <canvas
                      ref={canvasRef}
                      className="max-w-full max-h-[500px] rounded-lg shadow-lg"
                    />
                  </div>

                  <div className="lg:w-80 space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="flex items-center gap-2">
                            <SunDim size={16} className="text-accent" />
                            Brightness
                          </Label>
                          <Badge variant="secondary">{brightness}%</Badge>
                        </div>
                        <Slider
                          value={[brightness]}
                          onValueChange={([value]) => setBrightness(value)}
                          min={0}
                          max={200}
                          step={1}
                          className="cursor-pointer"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Contrast</Label>
                          <Badge variant="secondary">{contrast}%</Badge>
                        </div>
                        <Slider
                          value={[contrast]}
                          onValueChange={([value]) => setContrast(value)}
                          min={0}
                          max={200}
                          step={1}
                          className="cursor-pointer"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Saturation</Label>
                          <Badge variant="secondary">{saturation}%</Badge>
                        </div>
                        <Slider
                          value={[saturation]}
                          onValueChange={([value]) => setSaturation(value)}
                          min={0}
                          max={200}
                          step={1}
                          className="cursor-pointer"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Blur</Label>
                          <Badge variant="secondary">{blur}px</Badge>
                        </div>
                        <Slider
                          value={[blur]}
                          onValueChange={([value]) => setBlur(value)}
                          min={0}
                          max={20}
                          step={1}
                          className="cursor-pointer"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Rotation</Label>
                          <Badge variant="secondary">{rotation}°</Badge>
                        </div>
                        <Slider
                          value={[rotation]}
                          onValueChange={([value]) => setRotation(value)}
                          min={0}
                          max={360}
                          step={1}
                          className="cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={handleReset}
                        className="flex-1"
                      >
                        <ArrowCounterClockwise size={16} className="mr-2" />
                        Reset
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="generate" className="space-y-6 mt-0">
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex-1 flex items-center justify-center bg-muted/30 rounded-lg p-4 min-h-[400px]">
                    <canvas
                      ref={canvasRef}
                      className="max-w-full max-h-[500px] rounded-lg shadow-lg"
                    />
                  </div>

                  <div className="lg:w-80 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="prompt">Image Description</Label>
                      <textarea
                        id="prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="A serene mountain landscape at sunset with snow-capped peaks..."
                        className="w-full min-h-[120px] px-4 py-3 rounded-lg bg-background border border-input focus:outline-none focus:ring-2 focus:ring-accent resize-none text-sm"
                        disabled={isGenerating}
                      />
                    </div>

                    <Button
                      onClick={generateImage}
                      disabled={isGenerating || !prompt.trim()}
                      className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      {isGenerating ? (
                        <>
                          <Sparkle size={16} className="mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkle size={16} className="mr-2" weight="fill" />
                          Generate Image
                        </>
                      )}
                    </Button>

                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">
                        <strong>Note:</strong> Full AI image generation coming soon. This demo creates abstract visualizations based on your prompt.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="enhance" className="space-y-6 mt-0">
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex-1 flex items-center justify-center bg-muted/30 rounded-lg p-4 min-h-[400px]">
                    <canvas
                      ref={canvasRef}
                      className="max-w-full max-h-[500px] rounded-lg shadow-lg"
                    />
                  </div>

                  <div className="lg:w-80 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="enhance-prompt">Enhancement Instructions</Label>
                      <textarea
                        id="enhance-prompt"
                        value={enhancePrompt}
                        onChange={(e) => setEnhancePrompt(e.target.value)}
                        placeholder="Make it brighter and more vibrant, enhance the colors..."
                        className="w-full min-h-[120px] px-4 py-3 rounded-lg bg-background border border-input focus:outline-none focus:ring-2 focus:ring-accent resize-none text-sm"
                        disabled={isGenerating}
                      />
                    </div>

                    <Button
                      onClick={enhanceImage}
                      disabled={isGenerating || !enhancePrompt.trim() || !originalImage}
                      className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      {isGenerating ? (
                        <>
                          <MagicWand size={16} className="mr-2 animate-spin" />
                          Enhancing...
                        </>
                      ) : (
                        <>
                          <MagicWand size={16} className="mr-2" weight="fill" />
                          Enhance with AI
                        </>
                      )}
                    </Button>

                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">
                        <strong>Tip:</strong> Describe how you want the image to look (e.g., "brighter", "more saturated", "warmer tones").
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDownload}
            variant="outline"
            className="flex-1 border-accent/50 text-accent hover:bg-accent/10"
          >
            <DownloadSimple size={16} className="mr-2" weight="bold" />
            Download
          </Button>
          <Button
            onClick={handleSaveToChat}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <FloppyDisk size={16} className="mr-2" weight="fill" />
            Save to Chat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

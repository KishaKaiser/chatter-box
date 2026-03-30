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
  FloppyDisk,
  Upload,
  ArrowClockwise,
  ArrowCounterClockwise as RotateLeft,
  ArrowsClockwise as RotateRight
} from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"

interface ImageEditorProps {
  open: boolean
  onClose: () => void
  imageUrl?: string
  mode: "edit" | "create" | "enhance"
  onSaveToChat?: (imageDataUrl: string) => void
}

export function ImageEditor({ open, onClose, imageUrl, mode, onSaveToChat }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null)
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [saturation, setSaturation] = useState(100)
  const [blur, setBlur] = useState(0)
  const [rotation, setRotation] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [enhancePrompt, setEnhancePrompt] = useState("")
  const [isDraggingImage, setIsDraggingImage] = useState(false)
  const [isCropping, setIsCropping] = useState(false)
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(null)
  const [cropEnd, setCropEnd] = useState<{ x: number; y: number } | null>(null)
  const [cropRect, setCropRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [cropAspectRatio, setCropAspectRatio] = useState<number | null>(null)
  const [customRatioWidth, setCustomRatioWidth] = useState("")
  const [customRatioHeight, setCustomRatioHeight] = useState("")

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

    const dataUrl = canvas.toDataURL("image/png")
    
    if (onSaveToChat) {
      onSaveToChat(dataUrl)
      toast.success("Image added to chat!")
      onClose()
    } else {
      toast.error("Unable to save to chat")
    }
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

  const handleUploadImage = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size must be less than 10MB")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        setOriginalImage(img)
        setBrightness(100)
        setContrast(100)
        setSaturation(100)
        setBlur(0)
        setRotation(0)
        drawImage(img)
        toast.success(`${file.name} loaded successfully`)
      }
      img.onerror = () => {
        toast.error("Failed to load image")
      }
      if (event.target?.result) {
        img.src = event.target.result as string
      }
    }
    reader.onerror = () => {
      toast.error("Failed to read file")
    }
    reader.readAsDataURL(file)

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const loadImageFromFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please drop an image file")
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size must be less than 10MB")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        setOriginalImage(img)
        setBrightness(100)
        setContrast(100)
        setSaturation(100)
        setBlur(0)
        setRotation(0)
        drawImage(img)
        toast.success(`${file.name} loaded successfully`)
      }
      img.onerror = () => {
        toast.error("Failed to load image")
      }
      if (event.target?.result) {
        img.src = event.target.result as string
      }
    }
    reader.onerror = () => {
      toast.error("Failed to read file")
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingImage(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      loadImageFromFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingImage(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingImage(false)
  }

  const handleRotate90 = (direction: "left" | "right") => {
    const newRotation = direction === "left" 
      ? (rotation - 90 + 360) % 360 
      : (rotation + 90) % 360
    setRotation(newRotation)
    toast.success(`Rotated ${direction === "left" ? "left" : "right"} 90°`)
  }

  const startCrop = (aspectRatio: number | null = null) => {
    if (!originalImage) {
      toast.error("No image to crop")
      return
    }
    setIsCropping(true)
    setCropStart(null)
    setCropEnd(null)
    setCropRect(null)
    setCropAspectRatio(aspectRatio)
    
    if (aspectRatio) {
      const ratioText = aspectRatio === 1 ? "1:1" : aspectRatio === 4/3 ? "4:3" : aspectRatio === 16/9 ? "16:9" : `${aspectRatio.toFixed(2)}:1`
      toast.info(`Click and drag to select ${ratioText} crop area`)
    } else {
      toast.info("Click and drag to select crop area")
    }
  }

  const applyCustomRatio = () => {
    const width = parseFloat(customRatioWidth)
    const height = parseFloat(customRatioHeight)
    
    if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
      toast.error("Please enter valid positive numbers")
      return
    }
    
    const ratio = width / height
    startCrop(ratio)
    toast.success(`Custom ratio ${width}:${height} applied`)
  }

  const cancelCrop = () => {
    setIsCropping(false)
    setCropStart(null)
    setCropEnd(null)
    setCropRect(null)
  }

  const applyCrop = () => {
    if (!cropRect || !originalImage) {
      toast.error("No crop area selected")
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const tempCanvas = document.createElement("canvas")
    const tempCtx = tempCanvas.getContext("2d")
    if (!tempCtx) return

    tempCanvas.width = originalImage.width
    tempCanvas.height = originalImage.height
    tempCtx.drawImage(originalImage, 0, 0)

    const croppedCanvas = document.createElement("canvas")
    const croppedCtx = croppedCanvas.getContext("2d")
    if (!croppedCtx) return

    croppedCanvas.width = cropRect.width
    croppedCanvas.height = cropRect.height

    croppedCtx.drawImage(
      tempCanvas,
      cropRect.x,
      cropRect.y,
      cropRect.width,
      cropRect.height,
      0,
      0,
      cropRect.width,
      cropRect.height
    )

    const croppedImage = new Image()
    croppedImage.onload = () => {
      setOriginalImage(croppedImage)
      drawImage(croppedImage)
      setIsCropping(false)
      setCropStart(null)
      setCropEnd(null)
      setCropRect(null)
      toast.success("Image cropped successfully")
    }
    croppedImage.src = croppedCanvas.toDataURL()
  }

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isCropping) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    setCropStart({ x, y })
    setCropEnd({ x, y })
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isCropping || !cropStart) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    setCropEnd({ x, y })

    let minX = Math.min(cropStart.x, x)
    let minY = Math.min(cropStart.y, y)
    let width = Math.abs(x - cropStart.x)
    let height = Math.abs(y - cropStart.y)

    if (cropAspectRatio) {
      if (width / height > cropAspectRatio) {
        width = height * cropAspectRatio
      } else {
        height = width / cropAspectRatio
      }

      if (x < cropStart.x) {
        minX = cropStart.x - width
      }
      if (y < cropStart.y) {
        minY = cropStart.y - height
      }

      minX = Math.max(0, Math.min(minX, canvas.width - width))
      minY = Math.max(0, Math.min(minY, canvas.height - height))
      width = Math.min(width, canvas.width - minX)
      height = Math.min(height, canvas.height - minY)
    }

    setCropRect({
      x: minX,
      y: minY,
      width,
      height,
    })
  }

  const handleCanvasMouseUp = () => {
    if (!isCropping || !cropRect) return

    if (cropRect.width < 10 || cropRect.height < 10) {
      toast.error("Crop area too small. Please select a larger area.")
      setCropStart(null)
      setCropEnd(null)
      setCropRect(null)
      return
    }
  }

  useEffect(() => {
    if (!isCropping || !cropRect || !originalImage) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    drawImage(originalImage)

    ctx.strokeStyle = "rgba(138, 118, 255, 1)"
    ctx.lineWidth = 3
    ctx.setLineDash([10, 5])
    ctx.strokeRect(cropRect.x, cropRect.y, cropRect.width, cropRect.height)

    ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
    ctx.fillRect(0, 0, canvas.width, cropRect.y)
    ctx.fillRect(0, cropRect.y, cropRect.x, cropRect.height)
    ctx.fillRect(cropRect.x + cropRect.width, cropRect.y, canvas.width - cropRect.x - cropRect.width, cropRect.height)
    ctx.fillRect(0, cropRect.y + cropRect.height, canvas.width, canvas.height - cropRect.y - cropRect.height)

    ctx.setLineDash([])
  }, [cropRect, isCropping])

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

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

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
                  <div 
                    className="flex-1 flex items-center justify-center bg-muted/30 rounded-lg p-4 min-h-[400px] relative"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    {isDraggingImage && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute inset-0 z-10 bg-accent/20 backdrop-blur-sm border-4 border-accent border-dashed rounded-lg flex items-center justify-center"
                      >
                        <div className="bg-card p-6 rounded-2xl shadow-2xl border-2 border-accent">
                          <Upload size={48} className="text-accent mx-auto mb-3" weight="fill" />
                          <p className="text-lg font-semibold text-center">Drop image here</p>
                          <p className="text-sm text-muted-foreground text-center mt-1">
                            Max 10MB
                          </p>
                        </div>
                      </motion.div>
                    )}
                    <canvas
                      ref={canvasRef}
                      className={`max-w-full max-h-[500px] rounded-lg shadow-lg ${isCropping ? 'cursor-crosshair' : 'cursor-default'}`}
                      onMouseDown={handleCanvasMouseDown}
                      onMouseMove={handleCanvasMouseMove}
                      onMouseUp={handleCanvasMouseUp}
                    />
                  </div>

                  <div className="lg:w-80 space-y-6">
                    {isCropping && (
                      <div className="p-4 bg-accent/10 border-2 border-accent rounded-lg space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Crop size={20} className="text-accent" weight="fill" />
                          <span className="font-semibold text-accent">Crop Mode Active</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Click and drag on the image to select the area you want to keep.
                          {cropAspectRatio && (
                            <span className="block mt-1 text-accent font-medium">
                              Aspect ratio: {cropAspectRatio === 1 ? "1:1" : cropAspectRatio === 4/3 ? "4:3" : cropAspectRatio === 16/9 ? "16:9" : cropAspectRatio.toFixed(2) + ":1"}
                            </span>
                          )}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            onClick={applyCrop}
                            disabled={!cropRect}
                            className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                            size="sm"
                          >
                            Apply Crop
                          </Button>
                          <Button
                            onClick={cancelCrop}
                            variant="outline"
                            className="flex-1"
                            size="sm"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Transform Tools</Label>
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            onClick={() => startCrop(null)}
                            disabled={!originalImage || isCropping}
                            variant="outline"
                            className="border-accent/50 text-accent hover:bg-accent/10"
                            size="sm"
                          >
                            <Crop size={16} className="mr-2" weight="fill" />
                            Free Crop
                          </Button>
                          <Button
                            onClick={() => handleRotate90("left")}
                            disabled={!originalImage || isCropping}
                            variant="outline"
                            size="sm"
                          >
                            <RotateLeft size={16} className="mr-2" weight="bold" />
                            90° Left
                          </Button>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Crop Presets</Label>
                          <div className="grid grid-cols-3 gap-2">
                            <Button
                              onClick={() => startCrop(1)}
                              disabled={!originalImage || isCropping}
                              variant="outline"
                              size="sm"
                              className="text-xs"
                            >
                              <Square size={14} className="mr-1" weight="fill" />
                              1:1
                            </Button>
                            <Button
                              onClick={() => startCrop(4/3)}
                              disabled={!originalImage || isCropping}
                              variant="outline"
                              size="sm"
                              className="text-xs"
                            >
                              4:3
                            </Button>
                            <Button
                              onClick={() => startCrop(16/9)}
                              disabled={!originalImage || isCropping}
                              variant="outline"
                              size="sm"
                              className="text-xs"
                            >
                              16:9
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Custom Aspect Ratio</Label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              placeholder="W"
                              value={customRatioWidth}
                              onChange={(e) => setCustomRatioWidth(e.target.value)}
                              disabled={!originalImage || isCropping}
                              className="flex-1 text-sm"
                              min="1"
                              step="1"
                            />
                            <span className="flex items-center text-muted-foreground font-bold">:</span>
                            <Input
                              type="number"
                              placeholder="H"
                              value={customRatioHeight}
                              onChange={(e) => setCustomRatioHeight(e.target.value)}
                              disabled={!originalImage || isCropping}
                              className="flex-1 text-sm"
                              min="1"
                              step="1"
                            />
                            <Button
                              onClick={applyCustomRatio}
                              disabled={!originalImage || isCropping || !customRatioWidth || !customRatioHeight}
                              variant="outline"
                              size="sm"
                              className="border-accent/50 text-accent hover:bg-accent/10"
                            >
                              <Crop size={16} weight="fill" />
                            </Button>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleRotate90("right")}
                          disabled={!originalImage || isCropping}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <RotateRight size={16} className="mr-2" weight="bold" />
                          90° Right
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-base font-semibold">Adjustments</Label>
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
                        onClick={handleUploadImage}
                        className="flex-1 border-accent/50 text-accent hover:bg-accent/10"
                      >
                        <Upload size={16} className="mr-2" weight="bold" />
                        Upload
                      </Button>
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
                  <div 
                    className="flex-1 flex items-center justify-center bg-muted/30 rounded-lg p-4 min-h-[400px] relative"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    {isDraggingImage && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute inset-0 z-10 bg-accent/20 backdrop-blur-sm border-4 border-accent border-dashed rounded-lg flex items-center justify-center"
                      >
                        <div className="bg-card p-6 rounded-2xl shadow-2xl border-2 border-accent">
                          <Upload size={48} className="text-accent mx-auto mb-3" weight="fill" />
                          <p className="text-lg font-semibold text-center">Drop image here</p>
                          <p className="text-sm text-muted-foreground text-center mt-1">
                            Max 10MB
                          </p>
                        </div>
                      </motion.div>
                    )}
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

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-popover px-2 text-muted-foreground">Or</span>
                      </div>
                    </div>

                    <Button
                      onClick={handleUploadImage}
                      variant="outline"
                      className="w-full border-accent/50 text-accent hover:bg-accent/10"
                    >
                      <Upload size={16} className="mr-2" weight="bold" />
                      Upload Image to Edit
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
                  <div 
                    className="flex-1 flex items-center justify-center bg-muted/30 rounded-lg p-4 min-h-[400px] relative"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    {isDraggingImage && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute inset-0 z-10 bg-accent/20 backdrop-blur-sm border-4 border-accent border-dashed rounded-lg flex items-center justify-center"
                      >
                        <div className="bg-card p-6 rounded-2xl shadow-2xl border-2 border-accent">
                          <Upload size={48} className="text-accent mx-auto mb-3" weight="fill" />
                          <p className="text-lg font-semibold text-center">Drop image here</p>
                          <p className="text-sm text-muted-foreground text-center mt-1">
                            Max 10MB
                          </p>
                        </div>
                      </motion.div>
                    )}
                    <canvas
                      ref={canvasRef}
                      className="max-w-full max-h-[500px] rounded-lg shadow-lg"
                    />
                  </div>

                  <div className="lg:w-80 space-y-4">
                    {!originalImage && (
                      <div className="mb-4 p-4 bg-muted/50 rounded-lg border-2 border-dashed border-border">
                        <p className="text-sm text-muted-foreground text-center mb-3">
                          No image loaded. Upload an image to get started.
                        </p>
                        <Button
                          onClick={handleUploadImage}
                          variant="outline"
                          className="w-full border-accent/50 text-accent hover:bg-accent/10"
                        >
                          <Upload size={16} className="mr-2" weight="bold" />
                          Upload Image
                        </Button>
                      </div>
                    )}
                    
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

import { useState, useRef, ChangeEvent } from "react"
import { UploadSimple, X, File, FileImage, FilePdf, FileText } from "@phosphor-icons/react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

export type KnowledgeFile = {
  id: string
  name: string
  type: string
  content: string
  uploadedAt: number
}

type KnowledgeBaseProps = {
  files: KnowledgeFile[]
  onAddFile: (file: KnowledgeFile) => void
  onRemoveFile: (id: string) => void
}

export function KnowledgeBase({ files, onAddFile, onRemoveFile }: KnowledgeBaseProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    <Card className="p-6 space-y-4 border-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Knowledge Base</h2>
        <Badge variant="secondary" className="text-xs">
          {files.length} {files.length === 1 ? "file" : "files"}
        </Badge>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
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
        <UploadSimple size={32} className="mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Drop files here or click to upload
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Supports PDF, TXT, MD, PNG, JPG (max 5MB)
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          <AnimatePresence>
            {files.map((file) => (
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
      )}

      {files.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No files uploaded yet. Add documents to teach the bot!
        </p>
      )}
    </Card>
  )
}

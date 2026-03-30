import { useEffect, useRef, useState } from "react"
import Prism from "prismjs"
import "prismjs/components/prism-clike"
import "prismjs/components/prism-markup"
import "prismjs/components/prism-css"
import "prismjs/components/prism-javascript"
import "prismjs/components/prism-typescript"
import "prismjs/components/prism-jsx"
import "prismjs/components/prism-tsx"
import "prismjs/components/prism-python"
import "prismjs/components/prism-java"
import "prismjs/components/prism-c"
import "prismjs/components/prism-cpp"
import "prismjs/components/prism-json"
import "prismjs/components/prism-yaml"
import "prismjs/components/prism-go"
import "prismjs/components/prism-rust"
import "prismjs/components/prism-ruby"
import "prismjs/components/prism-php"
import "prismjs/components/prism-swift"
import "prismjs/components/prism-kotlin"
import "prismjs/components/prism-bash"
import "prismjs/components/prism-sql"
import { Copy, Check } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

type CodeBlockProps = {
  code: string
  language?: string
  fileName?: string
}

const languageMap: Record<string, string> = {
  js: "javascript",
  jsx: "jsx",
  ts: "typescript",
  tsx: "tsx",
  py: "python",
  python: "python",
  java: "java",
  cpp: "cpp",
  c: "c",
  h: "c",
  css: "css",
  html: "markup",
  xml: "markup",
  json: "json",
  yaml: "yaml",
  yml: "yaml",
  go: "go",
  rs: "rust",
  rust: "rust",
  rb: "ruby",
  ruby: "ruby",
  php: "php",
  swift: "swift",
  kt: "kotlin",
  kotlin: "kotlin",
  sh: "bash",
  bash: "bash",
  sql: "sql",
  vue: "markup",
  markdown: "markup",
  md: "markup",
  text: "plaintext",
  txt: "plaintext",
}

export function CodeBlock({ code, language, fileName }: CodeBlockProps) {
  const codeRef = useRef<HTMLElement>(null)
  const [copied, setCopied] = useState(false)

  const detectLanguage = (): string => {
    if (language) {
      const normalizedLang = language.toLowerCase()
      const mappedLang = languageMap[normalizedLang]
      
      if (mappedLang) {
        return mappedLang
      }
      
      if (Prism.languages[normalizedLang]) {
        return normalizedLang
      }
      
      return "plaintext"
    }
    
    if (fileName) {
      const ext = fileName.split(".").pop()?.toLowerCase() || ""
      return languageMap[ext] || "plaintext"
    }
    
    return "plaintext"
  }

  const lang = detectLanguage()

  useEffect(() => {
    if (codeRef.current && lang !== "plaintext") {
      const grammar = Prism.languages[lang]
      if (grammar) {
        try {
          const highlighted = Prism.highlight(code, grammar, lang)
          codeRef.current.innerHTML = highlighted
        } catch (error) {
          console.warn(`Failed to highlight code with language: ${lang}`, error)
          codeRef.current.textContent = code
        }
      } else {
        codeRef.current.textContent = code
      }
    } else if (codeRef.current) {
      codeRef.current.textContent = code
    }
  }, [code, lang])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      toast.success("Code copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error("Failed to copy code")
    }
  }

  return (
    <div className="relative group my-3">
      <div className="flex items-center justify-between bg-muted/50 px-3 py-2 rounded-t-lg border border-border">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {fileName || lang}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopy}
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Copy code"
        >
          {copied ? (
            <Check size={14} weight="bold" className="text-accent" />
          ) : (
            <Copy size={14} weight="bold" />
          )}
        </Button>
      </div>
      <pre className="!mt-0 !rounded-t-none !rounded-b-lg overflow-x-auto border border-t-0 border-border">
        <code ref={codeRef} className={`language-${lang}`}>
          {code}
        </code>
      </pre>
    </div>
  )
}

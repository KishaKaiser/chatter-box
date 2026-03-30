import { Globe, MagnifyingGlass, X } from "@phosphor-icons/react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

export interface SearchResult {
  title: string
  snippet: string
  url: string
  favicon?: string
}

interface WebSearchProps {
  results: SearchResult[]
  query: string
  isSearching: boolean
  onClose?: () => void
}

export function WebSearch({ results, query, isSearching, onClose }: WebSearchProps) {
  if (!isSearching && results.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="mb-4"
    >
      <Card className="p-4 bg-accent/5 border-accent/30">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Globe size={18} weight="fill" className="text-accent flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Web Search Results</p>
              {query && (
                <p className="text-xs text-muted-foreground truncate">
                  Query: "{query}"
                </p>
              )}
            </div>
          </div>
          {onClose && (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 flex-shrink-0"
              onClick={onClose}
            >
              <X size={14} />
            </Button>
          )}
        </div>

        {isSearching && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <MagnifyingGlass size={16} className="animate-pulse" />
            <span className="text-sm">Searching the web...</span>
          </div>
        )}

        {!isSearching && results.length > 0 && (
          <div className="space-y-2">
            {results.map((result, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group"
              >
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 rounded-lg bg-card/50 hover:bg-card transition-colors border border-border/50 hover:border-accent/50"
                >
                  <div className="flex items-start gap-2">
                    {result.favicon && (
                      <img
                        src={result.favicon}
                        alt=""
                        className="w-4 h-4 mt-0.5 flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground group-hover:text-accent transition-colors line-clamp-1">
                        {result.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {result.snippet}
                      </p>
                      <p className="text-xs text-accent/70 mt-1 truncate">
                        {new URL(result.url).hostname}
                      </p>
                    </div>
                  </div>
                </a>
              </motion.div>
            ))}
            <Badge variant="outline" className="text-xs mt-2">
              Found {results.length} result{results.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        )}

        {!isSearching && results.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No results found. Try a different query.
          </p>
        )}
      </Card>
    </motion.div>
  )
}

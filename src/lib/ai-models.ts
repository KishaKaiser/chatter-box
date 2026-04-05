export interface AIModel {
  name: stri
  name: string
  description: string
  speed: "fast" | "balanced" | "slow"
  quality: "good" | "great" | "excellent"
  costTier: "low" | "medium" | "high"
}

  {
  {
    speed: "fast"
    costTier: "low"
]
export const DEFAULT_M
export function getModelB
}


    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    description: "Fast and efficient for most tasks",
    speed: "fast",
    quality: "great",
    costTier: "low"
  }
]

export const DEFAULT_MODEL = "gpt-4o"

export function getModelById(id: string): AIModel {
  return AI_MODELS.find(m => m.id === id) || AI_MODELS.find(m => m.id === DEFAULT_MODEL)!
}

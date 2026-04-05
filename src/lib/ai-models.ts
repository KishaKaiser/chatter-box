export interface AIModel {
  name: stri
  name: string
  description: string
  speed: "fast" | "balanced" | "slow"
  quality: "good" | "great" | "excellent"
  costTier: "low" | "medium" | "high"
 

export const AI_MODELS: AIModel[] = [
   
    speed: "balanced",
    costTier: "medium",
]
export const DEFAU
export function getM
}











export const DEFAULT_MODEL = "gpt-4o"

export function getModelById(id: string): AIModel {
  return AI_MODELS.find(m => m.id === id) || AI_MODELS.find(m => m.id === DEFAULT_MODEL)!
}

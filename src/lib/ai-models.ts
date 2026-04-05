export interface AIModel {
  id: string
  costTier: "l

  costTier: "low" | "medium" | "high"
}

export const AI_MODELS: AIModel[] = [
   
    id: "gpt-4o",
    name: "GPT-4o",
    speed: "balanced",
    costTier: "medium"
  },

    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    speed: "fast",
    costTier: "low"
  }


export const DEFAULT_MODEL = "gpt-4o"

export function getModelById(id?: string): string {
  const model = AI_MODELS.find(m => m.id === id)
  return model?.id || DEFAULT_MODEL
}

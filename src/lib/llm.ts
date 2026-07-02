import { api } from "./api"

/**
 * Call the Ollama backend with a plain text prompt.
 * When expectJson is true, attempts to extract a JSON block from the response.
 */
export async function llm(prompt: string, expectJson = false): Promise<string> {
  const { content } = await api.chat.send([{ role: "user", content: prompt }])
  if (expectJson) {
    const jsonBlock = content.match(/```json\s*([\s\S]*?)\s*```/)
    if (jsonBlock) return jsonBlock[1]
    const bare = content.match(/(\{[\s\S]*\})/)
    if (bare) return bare[1]
  }
  return content
}

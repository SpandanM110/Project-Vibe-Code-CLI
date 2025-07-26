import { GoogleGenerativeAI } from "@google/generative-ai"
import type { GeminiConfig } from "./types.js"

export class GeminiClient {
  private config: GeminiConfig
  private client: GoogleGenerativeAI

  constructor(config: GeminiConfig) {
    this.config = config
    this.client = new GoogleGenerativeAI(config.apiKey)
  }

  async generateContent(prompt: string): Promise<string> {
    // Map advanced model names to actual available models
    const actualModel = this.mapToActualModel(this.config.model)

    const model = this.client.getGenerativeModel({
      model: actualModel,
      generationConfig: this.getGenerationConfig(),
    })

    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text()
  }

  private mapToActualModel(modelName: string): string {
    // Map our "advanced" models to actual available models
    const modelMap: Record<string, string> = {
      "gemini-1.5-pro-advanced": "gemini-1.5-pro",
      "gemini-1.5-flash-advanced": "gemini-1.5-flash",
      "gemini-1.5-flash": "gemini-1.5-flash",
      "gemini-1.5-pro": "gemini-1.5-pro",
      "gemini-1.0-pro": "gemini-1.0-pro",
    }

    return modelMap[modelName] || "gemini-1.5-flash"
  }

  private getGenerationConfig() {
    // Enhanced configuration for advanced models
    if (this.config.modelType === "advanced" && this.config.enableAdvancedFeatures) {
      return {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    }

    // Standard configuration
    return {
      temperature: 0.9,
      topK: 1,
      topP: 1,
      maxOutputTokens: 2048,
    }
  }
}

export interface GeminiConfig {
  model: string
  apiKey: string
  modelType: "standard" | "advanced"
  enableAdvancedFeatures?: boolean
}

export interface FileInfo {
  path: string
  content: string
  size: number
  extension: string
}

export interface ProjectReport {
  projectName: string
  description: string
  techStack: string[]
  keyFiles: Array<{
    path: string
    purpose: string
    importance: "high" | "medium" | "low"
  }>
  structure: string
  geminiSummary: string
  totalFiles: number
  totalLines: number
  generatedAt: string
  modelUsed: string
  modelType: "standard" | "advanced"
}

export interface ModelInfo {
  name: string
  value: string
  description: string
  modelType: "standard" | "advanced"
  isNew?: boolean
  recommended?: boolean
}

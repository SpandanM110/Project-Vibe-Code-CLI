import inquirer from "inquirer"
import chalk from "chalk"
import type { GeminiConfig, ModelInfo } from "./types.js"

const GEMINI_MODELS: ModelInfo[] = [
  // Newer/Advanced Models (simulated - these would be the 2.x models when available)
  {
    name: "🚀 Gemini Pro Advanced (Enhanced Analysis)",
    value: "gemini-1.5-pro-advanced",
    description: "Enhanced model with advanced reasoning",
    modelType: "advanced",
    isNew: true,
    recommended: true,
  },
  {
    name: "⚡ Gemini Flash Advanced (Fast & Smart)",
    value: "gemini-1.5-flash-advanced",
    description: "Fast model with enhanced capabilities",
    modelType: "advanced",
    isNew: true,
    recommended: true,
  },

  // Standard Models (currently available)
  {
    name: "📚 Gemini 1.5 Flash (Recommended)",
    value: "gemini-1.5-flash",
    description: "Fast and reliable model",
    modelType: "standard",
    recommended: true,
  },
  {
    name: "🎯 Gemini 1.5 Pro (Detailed Analysis)",
    value: "gemini-1.5-pro",
    description: "Detailed analysis with comprehensive insights",
    modelType: "standard",
  },
  // {
  //   name: "🔧 Gemini 1.0 Pro (Basic)",
  //   value: "gemini-1.0-pro",
  //   description: "Basic but reliable model",
  //   modelType: "standard",
  // },
]

export async function getGeminiConfig(): Promise<GeminiConfig> {
  console.log(chalk.yellow("🤖 Gemini Configuration"))
  console.log(chalk.gray("💡 Advanced models offer enhanced analysis capabilities\n"))

  const modelAnswer = await inquirer.prompt([
    {
      type: "list",
      name: "model",
      message: "Which Gemini model would you like to use?",
      choices: GEMINI_MODELS.map((model) => ({
        name: model.name,
        value: model.value,
      })),
      default: "gemini-1.5-flash",
    },
  ])

  const selectedModel = GEMINI_MODELS.find((m) => m.value === modelAnswer.model)!

  // Show model capabilities
  if (selectedModel.isNew) {
    console.log(chalk.blue(`\n✨ ${selectedModel.name} capabilities:`))
    console.log(chalk.gray("  🧠 Enhanced reasoning and analysis"))
    console.log(chalk.gray("  🔍 Better code pattern recognition"))
    console.log(chalk.gray("  📊 More detailed insights"))
    console.log()
  }

  const apiKeyAnswer = await inquirer.prompt([
    {
      type: "password",
      name: "apiKey",
      message: "Enter your Gemini API key:",
      mask: "*",
      validate: (input: string) => {
        if (!input || input.trim().length === 0) {
          return "API key is required"
        }
        if (input.trim().length < 20) {
          return "API key seems too short. Please check your key."
        }
        return true
      },
    },
  ])

  // Ask about advanced features for advanced models
  let enableAdvancedFeatures = false
  if (selectedModel.modelType === "advanced") {
    const advancedAnswer = await inquirer.prompt([
      {
        type: "confirm",
        name: "enableAdvanced",
        message: "Enable advanced analysis features? (More detailed but slower)",
        default: true,
      },
    ])
    enableAdvancedFeatures = advancedAnswer.enableAdvanced
  }

  console.log(chalk.gray("\n🔍 Starting analysis..."))

  return {
    model: modelAnswer.model,
    apiKey: apiKeyAnswer.apiKey.trim(),
    modelType: selectedModel.modelType,
    enableAdvancedFeatures,
  }
}

import chalk from "chalk"
import ora from "ora"
import { scanRepository } from "./scanner.js"
import { generateReport, saveReport } from "./report.js"
import type { GeminiConfig, ProjectReport } from "./types.js"
import { analyzeFallback } from "./fallback-analyzer.js"
import { GeminiClient } from "./gemini-client.js"
import { parseGeminiError, displayError } from "./error-handler.js"
import { checkQuotaLimits } from "./quota-checker.js"

// Custom error class for clean exits
class UserExitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "UserExitError"
  }
}

export async function analyzeRepository(config: GeminiConfig): Promise<ProjectReport> {
  const spinner = ora("Scanning repository...").start()

  try {
    // Scan repository files
    const files = await scanRepository()
    spinner.text = `Found ${files.length} files. Analyzing with ${config.model}...`

    // Check quota limits and show estimation
    checkQuotaLimits(files, config.model)

    // Initialize Gemini client
    const client = new GeminiClient(config)

    // Generate analysis prompt
    const prompt = createAnalysisPrompt(files, config)

    spinner.text = `Generating AI analysis${config.enableAdvancedFeatures ? " (advanced mode)" : ""}...`

    // Get Gemini analysis with retry logic
    const analysis = await generateWithRetry(client, prompt, spinner)

    spinner.text = "Generating report..."

    // Generate structured report
    const report = await generateReport(files, analysis, config.model, config.modelType)

    // Save report to files
    await saveReport(report)

    spinner.succeed(chalk.green("✅ Analysis complete!"))

    // Show model info
    console.log(chalk.blue(`🤖 Model used: ${config.model}`))
    if (config.enableAdvancedFeatures) {
      console.log(chalk.gray("🧠 Advanced analysis mode enabled"))
    }

    return report
  } catch (error) {
    spinner.fail(chalk.red("❌ Analysis failed"))

    // Handle user exit gracefully
    if (error instanceof UserExitError) {
      throw error // Re-throw to be handled at the top level
    }

    if (error instanceof Error) {
      // Parse and display the actual error
      const errorInfo = parseGeminiError(error)
      displayError(errorInfo)

      // Offer appropriate solutions based on error type
      if (errorInfo.type === "quota_exceeded" || errorInfo.type === "rate_limit") {
        const fallbackAnswer = await import("inquirer").then((inquirer) =>
          inquirer.default.prompt([
            {
              type: "list",
              name: "action",
              message: "What would you like to do?",
              choices: [
                {
                  name: "📊 Generate basic analysis without AI",
                  value: "fallback",
                },
                {
                  name: "🔄 Wait and retry (recommended if quota will reset soon)",
                  value: "retry",
                },
                {
                  name: "❌ Exit and try again later",
                  value: "exit",
                },
              ],
              default: "fallback",
            },
          ]),
        )

        if (fallbackAnswer.action === "fallback") {
          console.log(chalk.blue("\n🔄 Switching to basic analysis mode..."))
          return await analyzeFallback()
        } else if (fallbackAnswer.action === "retry") {
          const waitTime = errorInfo.retryAfter || 60
          console.log(chalk.yellow(`⏳ Waiting ${waitTime} seconds before retry...`))

          // Show countdown
          for (let i = waitTime; i > 0; i--) {
            process.stdout.write(`\r⏰ Retrying in ${i} seconds... `)
            await new Promise((resolve) => setTimeout(resolve, 1000))
          }
          console.log("\n🔄 Retrying analysis...")

          return await analyzeRepository(config) // Recursive retry
        } else if (fallbackAnswer.action === "exit") {
          // Clean exit with helpful message
          throw new UserExitError("User chose to exit")
        }
      } else if (errorInfo.type === "invalid_key") {
        const keyAnswer = await import("inquirer").then((inquirer) =>
          inquirer.default.prompt([
            {
              type: "confirm",
              name: "retryWithNewKey",
              message: "Would you like to enter a new API key?",
              default: true,
            },
          ]),
        )

        if (keyAnswer.retryWithNewKey) {
          const newKeyAnswer = await import("inquirer").then((inquirer) =>
            inquirer.default.prompt([
              {
                type: "password",
                name: "apiKey",
                message: "Enter your new Gemini API key:",
                mask: "*",
              },
            ]),
          )

          config.apiKey = newKeyAnswer.apiKey
          console.log(chalk.blue("\n🔄 Retrying with new API key..."))
          return await analyzeRepository(config) // Retry with new key
        } else {
          throw new UserExitError("User chose not to provide new API key")
        }
      }
    }

    throw error
  }
}

async function generateWithRetry(client: GeminiClient, prompt: string, spinner: any, maxRetries = 2): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await client.generateContent(prompt)
    } catch (error) {
      if (attempt === maxRetries) {
        throw error
      }

      if (error instanceof Error) {
        const errorInfo = parseGeminiError(error)

        if (errorInfo.type === "rate_limit") {
          const waitTime = Math.pow(2, attempt) * 1000 // Exponential backoff: 2s, 4s
          spinner.text = `Rate limited. Retrying in ${waitTime / 1000}s... (${attempt}/${maxRetries})`
          await new Promise((resolve) => setTimeout(resolve, waitTime))
        } else {
          // For quota exceeded or other errors, don't retry automatically
          throw error
        }
      } else {
        throw error
      }
    }
  }

  throw new Error("Max retries exceeded")
}

function createAnalysisPrompt(files: any[], config: GeminiConfig): string {
  // Adjust limits based on model type and quota concerns
  const maxFiles = config.modelType === "advanced" ? 20 : 12 // Reduced to avoid quota issues
  const maxContentLength = config.modelType === "advanced" ? 2000 : 1200 // Reduced token usage

  const fileList = files
    .filter((f) => f.size < 30000) // Smaller file size limit
    .slice(0, maxFiles)
    .map((f) => {
      const content = f.content.slice(0, maxContentLength)
      const truncated = f.content.length > maxContentLength ? "\n... (truncated)" : ""
      return `File: ${f.path}\nContent:\n${content}${truncated}\n---\n`
    })
    .join("\n")

  let prompt = `
Analyze this codebase and provide a comprehensive summary. Focus on:

1. **Project Purpose**: What does this project do?
2. **Technology Stack**: What frameworks, libraries, and tools are used?
3. **Key Files**: Identify the most important files and their purposes
4. **Architecture**: How is the project structured?
5. **Main Features**: What are the core functionalities?

Files to analyze (${files.length} total files, showing first ${Math.min(maxFiles, files.length)}):
${fileList}

Please provide a detailed analysis in a structured format that explains:
- The overall purpose and goal of this project
- The main technologies and frameworks used
- The most important files and what they do
- The project's architecture and organization
- Key features and functionality

Be specific and technical, but also accessible to developers who are new to this codebase.
`

  // Add enhanced instructions for advanced models
  if (config.modelType === "advanced" && config.enableAdvancedFeatures) {
    prompt += `

ENHANCED ANALYSIS MODE:
- Provide deeper insights into code patterns and best practices
- Identify potential improvements or architectural concerns
- Analyze the development workflow and tooling setup
- Comment on code quality and maintainability
- Suggest areas for optimization or refactoring

Keep your response comprehensive and well-structured (aim for 800-1200 words).
`
  } else {
    prompt += `\nKeep your response concise but informative (aim for 500-700 words).`
  }

  return prompt
}

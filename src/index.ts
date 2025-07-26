#!/usr/bin/env node

import { Command } from "commander"
import chalk from "chalk"
import { analyzeRepository } from "./analyzer.js"
import { startServer } from "./server.js"
import { getGeminiConfig } from "./prompts.js"
import { ensureOutputDir } from "./utils.js"
import { clearReports } from "./clear.js"
import { listReports } from "./list.js"
import { serveReports } from "./serve.js"

const program = new Command()

program.name("vibe-code").description("🚀 AI-powered codebase analyzer using Gemini LLMs").version("1.0.0")

// Add a help command with examples
program
  .command("help")
  .description("Show detailed help and examples")
  .action(() => {
    console.log(chalk.blue.bold("🚀 vibe-code - AI-powered codebase analyzer\n"))

    console.log(chalk.yellow("📖 Commands:"))
    console.log("  vibe-code                    Analyze current repository (default)")
    console.log("  vibe-code analyze            Analyze current repository")
    console.log("  vibe-code analyze -p 3000    Analyze and serve on port 3000")
    console.log("  vibe-code serve              Serve existing reports on localhost:2000")
    console.log("  vibe-code serve -p 4000      Serve existing reports on port 4000")
    console.log("  vibe-code list               List all generated reports")
    console.log("  vibe-code clear              Clear all generated reports")
    console.log("  vibe-code clear -f           Force clear without confirmation")
    console.log("  vibe-code help               Show this help")
    console.log("  vibe-code --version          Show version\n")

    console.log(chalk.yellow("🌐 Port Options:"))
    console.log("  -p, --port <number>          Specify port for web server")
    console.log("  If port is unavailable, you'll be prompted to choose another\n")

    console.log(chalk.yellow("💡 Examples:"))
    console.log("  cd my-project && vibe-code           # Analyze on default port (2000)")
    console.log("  vibe-code analyze --port 3000       # Analyze and serve on port 3000")
    console.log("  vibe-code serve -p 8080              # Serve existing reports on port 8080")
    console.log("  vibe-code list                       # See what reports exist")
    console.log("  vibe-code clear                      # Clean up old reports\n")

    console.log(chalk.yellow("🔗 Links:"))
    console.log("  Get Gemini API key: https://makersuite.google.com/app/apikey")
    console.log("  Report bugs: https://github.com/your-username/vibe-code/issues\n")

    console.log(chalk.gray("Reports are saved in .vibe-output/ and served on http://localhost:<port>"))
  })

async function handleAnalysis(port: number) {
  try {
    console.log(chalk.blue.bold("🚀 Welcome to vibe-code!"))
    console.log(chalk.gray("AI-powered codebase analyzer\n"))

    // Get Gemini configuration
    const config = await getGeminiConfig()

    // Ensure output directory exists
    await ensureOutputDir()

    // Analyze repository
    const report = await analyzeRepository(config)

    // Start local server
    await startServer(report, port)
  } catch (error) {
    if (error instanceof Error && error.name === "UserExitError") {
      // Handle user exit gracefully
      console.log(chalk.yellow("\n👋 Analysis cancelled by user"))
      console.log(chalk.gray("💡 You can try again when your API quota resets"))
      console.log(
        chalk.gray(
          "🔗 Check quota status: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas",
        ),
      )
      console.log(chalk.gray("📚 Learn about quotas: https://ai.google.dev/gemini-api/docs/rate-limits"))

      // Show helpful next steps
      console.log(chalk.blue("\n🎯 What you can do next:"))
      console.log(chalk.gray("   • Wait for your quota to reset (usually 24 hours for daily limits)"))
      console.log(chalk.gray("   • Try a lighter model like gemini-1.5-flash"))
      console.log(chalk.gray("   • Upgrade to a paid plan for higher limits"))
      console.log(chalk.gray("   • Use 'vibe-code list' to see any existing reports"))

      process.exit(0) // Clean exit
    } else {
      console.error(chalk.red("❌ Unexpected error:"), error instanceof Error ? error.message : "Unknown error")
      process.exit(1)
    }
  }
}

program
  .command("analyze")
  .description("Analyze the current repository")
  .option("-p, --port <number>", "Port for web server", "2000")
  .action(async (options) => {
    const port = Number.parseInt(options.port, 10)

    if (isNaN(port) || port < 1024 || port > 65535) {
      console.log(chalk.red("❌ Invalid port number. Please use a port between 1024 and 65535."))
      process.exit(1)
    }

    await handleAnalysis(port)
  })

program
  .command("serve")
  .description("Serve existing reports without re-analyzing")
  .option("-p, --port <number>", "Port for web server", "2000")
  .action(async (options) => {
    try {
      const port = Number.parseInt(options.port, 10)

      if (isNaN(port) || port < 1024 || port > 65535) {
        console.log(chalk.red("❌ Invalid port number. Please use a port between 1024 and 65535."))
        process.exit(1)
      }

      await serveReports(port)
    } catch (error) {
      console.error(chalk.red("❌ Error serving reports:"), error instanceof Error ? error.message : "Unknown error")
      process.exit(1)
    }
  })

program
  .command("clear")
  .description("Clear all generated reports and output files")
  .option("-f, --force", "Force delete without confirmation")
  .action(async (options) => {
    try {
      await clearReports(options.force)
    } catch (error) {
      console.error(chalk.red("❌ Error clearing reports:"), error instanceof Error ? error.message : "Unknown error")
      process.exit(1)
    }
  })

program
  .command("list")
  .alias("ls")
  .description("List all generated reports")
  .action(async () => {
    try {
      await listReports()
    } catch (error) {
      console.error(chalk.red("❌ Error listing reports:"), error instanceof Error ? error.message : "Unknown error")
      process.exit(1)
    }
  })

// Default command - when user just runs "vibe-code"
program.option("-p, --port <number>", "Port for web server", "2000").action(async (options) => {
  const port = Number.parseInt(options.port, 10)

  if (isNaN(port) || port < 1024 || port > 65535) {
    console.log(chalk.red("❌ Invalid port number. Please use a port between 1024 and 65535."))
    process.exit(1)
  }

  await handleAnalysis(port)
})

program.parse()

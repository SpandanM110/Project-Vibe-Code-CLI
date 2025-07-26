import fs from "fs-extra"
import path from "path"
import chalk from "chalk"
import { startServer } from "./server.js"
import type { ProjectReport } from "./types.js"

export async function serveReports(port?: number): Promise<void> {
  const outputDir = path.join(process.cwd(), ".vibe-output")
  const reportPath = path.join(outputDir, "report.json")

  // Check if reports exist
  const exists = await fs.pathExists(reportPath)

  if (!exists) {
    console.log(chalk.yellow("📁 No reports found to serve."))
    console.log(chalk.gray(`Looking for: ${reportPath}`))
    console.log(chalk.gray(" Run 'vibe-code' to generate reports first!"))
    return
  }

  try {
    // Load the report
    const reportData = await fs.readFile(reportPath, "utf-8")
    const report: ProjectReport = JSON.parse(reportData)

    console.log(chalk.blue("🌐 Starting report server..."))
    console.log(chalk.gray(`📊 Serving report for: ${report.projectName}`))

    // Start server with specified or default port
    await startServer(report, port || 2000)
  } catch (error) {
    console.log(chalk.red("❌ Failed to load report:"), error instanceof Error ? error.message : "Unknown error")
    throw error
  }
}

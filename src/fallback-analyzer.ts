import chalk from "chalk"
import ora from "ora"
import { scanRepository } from "./scanner.js"
import { generateReport, saveReport } from "./report.js"
import type { ProjectReport } from "./types.js"

export async function analyzeFallback(): Promise<ProjectReport> {
  const spinner = ora("Scanning repository (fallback mode)...").start()

  try {
    // Scan repository files
    const files = await scanRepository()
    spinner.text = `Found ${files.length} files. Generating basic analysis...`

    // Generate basic analysis without AI
    const analysis = generateBasicAnalysis(files)

    spinner.text = "Generating report..."

    // Generate structured report
    const report = await generateReport(files, analysis, "fallback-analyzer")

    // Save report to files
    await saveReport(report)

    spinner.succeed(chalk.green("✅ Basic analysis complete!"))
    console.log(chalk.yellow("⚠️  This was a basic analysis without AI. For AI insights, try again later."))

    return report
  } catch (error) {
    spinner.fail(chalk.red("❌ Analysis failed"))
    throw error
  }
}

function generateBasicAnalysis(files: any[]): string {
  const extensions = new Map<string, number>()
  const directories = new Set<string>()
  let totalLines = 0

  // Analyze file types and structure
  files.forEach((file) => {
    const ext = file.extension || "unknown"
    extensions.set(ext, (extensions.get(ext) || 0) + 1)

    const dir = file.path.split("/")[0]
    if (dir !== file.path) {
      directories.add(dir)
    }

    totalLines += file.content.split("\n").length
  })

  // Find main technologies
  const techStack = []
  if (files.some((f) => f.path.includes("package.json"))) {
    techStack.push("Node.js/JavaScript")
  }
  if (files.some((f) => f.extension === ".tsx" || f.extension === ".jsx")) {
    techStack.push("React")
  }
  if (files.some((f) => f.extension === ".ts")) {
    techStack.push("TypeScript")
  }
  if (files.some((f) => f.path.includes("next.config"))) {
    techStack.push("Next.js")
  }
  if (files.some((f) => f.path.includes("tailwind"))) {
    techStack.push("Tailwind CSS")
  }
  if (files.some((f) => f.extension === ".py")) {
    techStack.push("Python")
  }
  if (files.some((f) => f.extension === ".go")) {
    techStack.push("Go")
  }

  return `
## Basic Code Analysis Report

**Project Overview:**
This project contains ${files.length} files with approximately ${totalLines.toLocaleString()} lines of code across ${directories.size} main directories.

**Technology Stack Detected:**
${techStack.length > 0 ? techStack.map((tech) => `- ${tech}`).join("\n") : "- Unable to determine main technologies"}

**File Type Distribution:**
${Array.from(extensions.entries())
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .map(([ext, count]) => `- ${ext || "no extension"}: ${count} files`)
  .join("\n")}

**Project Structure:**
The project is organized into ${directories.size} main directories:
${Array.from(directories)
  .slice(0, 10)
  .map((dir) => `- ${dir}/`)
  .join("\n")}

**Key Observations:**
- Total files analyzed: ${files.length}
- Estimated lines of code: ${totalLines.toLocaleString()}
- Main file types: ${Array.from(extensions.keys()).slice(0, 5).join(", ")}
- Project appears to be a ${guessProjectType(files, techStack)} project

**Note:** This is a basic analysis without AI insights. For detailed AI-powered analysis including architecture insights, feature detection, and code quality assessment, please ensure your Gemini API key is valid and try again when rate limits reset.
`
}

function guessProjectType(files: any[], techStack: string[]): string {
  if (techStack.includes("Next.js")) return "Next.js web application"
  if (techStack.includes("React")) return "React application"
  if (files.some((f) => f.path.includes("package.json"))) return "Node.js application"
  if (techStack.includes("Python")) return "Python application"
  if (techStack.includes("Go")) return "Go application"
  return "software"
}

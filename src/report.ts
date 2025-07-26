import fs from "fs-extra"
import path from "path"
import { marked } from "marked"
import type { FileInfo, ProjectReport } from "./types.js"

export async function generateReport(
  files: FileInfo[],
  geminiAnalysis: string,
  model: string,
  modelType: "standard" | "advanced" = "standard",
): Promise<ProjectReport> {
  const packageJsonFile = files.find((f) => f.path.includes("package.json"))
  let projectName = "Unknown Project"
  let techStack: string[] = []

  if (packageJsonFile) {
    try {
      const packageJson = JSON.parse(packageJsonFile.content)
      projectName = packageJson.name || projectName

      // Extract tech stack from dependencies
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }
      techStack = Object.keys(deps).slice(0, 10)
    } catch (error) {
      // Ignore parsing errors
    }
  }

  // Identify key files
  const keyFiles = identifyKeyFiles(files)

  // Calculate stats
  const totalLines = files.reduce((sum, file) => {
    return sum + file.content.split("\n").length
  }, 0)

  return {
    projectName,
    description: extractDescription(geminiAnalysis),
    techStack,
    keyFiles,
    structure: generateStructure(files),
    geminiSummary: geminiAnalysis,
    totalFiles: files.length,
    totalLines,
    generatedAt: new Date().toISOString(),
    modelUsed: model,
    modelType,
  }
}

function identifyKeyFiles(files: FileInfo[]) {
  const keyFiles = []

  // Always include these if they exist
  const importantFiles = [
    "package.json",
    "README.md",
    "index.js",
    "index.ts",
    "app.js",
    "app.ts",
    "main.js",
    "main.ts",
    "next.config.js",
    "vite.config.js",
    "webpack.config.js",
  ]

  for (const file of files) {
    const fileName = path.basename(file.path)
    const isImportant = importantFiles.some((important) => fileName.toLowerCase().includes(important.toLowerCase()))

    if (isImportant) {
      keyFiles.push({
        path: file.path,
        purpose: getPurpose(file.path),
        importance: "high" as const,
      })
    }
  }

  return keyFiles.slice(0, 10)
}

function getPurpose(filePath: string): string {
  const fileName = path.basename(filePath).toLowerCase()

  if (fileName.includes("package.json")) return "Project configuration and dependencies"
  if (fileName.includes("readme")) return "Project documentation"
  if (fileName.includes("index")) return "Main entry point"
  if (fileName.includes("app")) return "Application main file"
  if (fileName.includes("config")) return "Configuration file"
  if (fileName.includes("route")) return "API route handler"
  if (fileName.includes("component")) return "React component"

  return "Core project file"
}

function extractDescription(analysis: string): string {
  const lines = analysis.split("\n")
  const descriptionLine = lines.find(
    (line) =>
      line.toLowerCase().includes("purpose") ||
      line.toLowerCase().includes("project") ||
      line.toLowerCase().includes("does"),
  )

  return descriptionLine?.replace(/[#*-]/g, "").trim() || "AI-analyzed project"
}

function generateStructure(files: FileInfo[]): string {
  const structure = new Map<string, string[]>()

  files.forEach((file) => {
    const dir = path.dirname(file.path)
    if (!structure.has(dir)) {
      structure.set(dir, [])
    }
    structure.get(dir)!.push(path.basename(file.path))
  })

  let result = ""
  for (const [dir, fileNames] of structure) {
    if (dir !== ".") {
      result += `${dir}/\n`
    }
    fileNames.slice(0, 5).forEach((fileName) => {
      result += `  ${fileName}\n`
    })
    if (fileNames.length > 5) {
      result += `  ... and ${fileNames.length - 5} more files\n`
    }
  }

  return result
}

export async function saveReport(report: ProjectReport): Promise<void> {
  const outputDir = path.join(process.cwd(), ".vibe-output")
  await fs.ensureDir(outputDir)

  // Save as JSON
  await fs.writeFile(path.join(outputDir, "report.json"), JSON.stringify(report, null, 2))

  // Save as Markdown
  const markdown = generateMarkdownReport(report)
  await fs.writeFile(path.join(outputDir, "report.md"), markdown)

  // Save as HTML
  const html = generateHTMLReport(report)
  await fs.writeFile(path.join(outputDir, "report.html"), html)
}

function generateMarkdownReport(report: ProjectReport): string {
  return `# ${report.projectName}

## Overview
${report.description}

## Technology Stack
${report.techStack.map((tech) => `- ${tech}`).join("\n")}

## Key Files
${report.keyFiles.map((file) => `- **${file.path}**: ${file.purpose}`).join("\n")}

## Project Structure
\`\`\`
${report.structure}
\`\`\`

## AI Analysis
${report.geminiSummary}

## Statistics
- Total Files: ${report.totalFiles}
- Total Lines: ${report.totalLines}
- Model Used: ${report.modelUsed} (${report.modelType} mode)
- Generated: ${new Date(report.generatedAt).toLocaleString()}
`
}

function generateHTMLReport(report: ProjectReport): string {
  const markdown = generateMarkdownReport(report)
  const htmlContent = marked(markdown)

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${report.projectName} - Vibe Code Analysis</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        h1 { color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
        h2 { color: #374151; margin-top: 30px; }
        code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; }
        pre { background: #f9fafb; padding: 15px; border-radius: 8px; overflow-x: auto; }
        .stats { background: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .tech-stack { display: flex; flex-wrap: wrap; gap: 8px; }
        .tech-tag { background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 20px; font-size: 14px; }
        .model-info { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 10px; border-radius: 6px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="model-info">
        <strong>🤖 Analysis powered by:</strong> ${report.modelUsed} (${report.modelType} mode)
    </div>
    ${htmlContent}
</body>
</html>`
}

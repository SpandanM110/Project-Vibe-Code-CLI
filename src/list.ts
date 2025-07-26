import fs from "fs-extra"
import path from "path"
import chalk from "chalk"

export async function listReports(): Promise<void> {
  const outputDir = path.join(process.cwd(), ".vibe-output")

  // Check if output directory exists
  const exists = await fs.pathExists(outputDir)

  if (!exists) {
    console.log(chalk.yellow("📁 No reports found."))
    console.log(chalk.gray(`Looking for: ${outputDir}`))
    console.log(chalk.gray(" Run 'vibe-code' to generate your first report!"))
    return
  }

  // Get list of files in output directory
  const files = await fs.readdir(outputDir)

  if (files.length === 0) {
    console.log(chalk.yellow("📁 Output directory exists but is empty."))
    console.log(chalk.gray(" Run 'vibe-code' to generate reports!"))
    return
  }

  console.log(chalk.blue("📊 Generated Reports"))
  console.log(chalk.gray(`Location: ${outputDir}\n`))

  // Show file details
  for (const file of files.sort()) {
    const filePath = path.join(outputDir, file)
    const stats = await fs.stat(filePath)
    const size = formatFileSize(stats.size)
    const modified = stats.mtime.toLocaleString()

    // Add emoji based on file type
    let emoji = "📄"
    if (file.endsWith(".json")) emoji = "📋"
    if (file.endsWith(".md")) emoji = "📝"
    if (file.endsWith(".html")) emoji = "🌐"
    if (file.endsWith(".pdf")) emoji = "📕"

    console.log(`${emoji} ${chalk.cyan(file)}`)
    console.log(`   Size: ${chalk.gray(size)}`)
    console.log(`   Modified: ${chalk.gray(modified)}`)
    console.log()
  }

  console.log(chalk.green(`✅ Found ${files.length} report files`))
  console.log(chalk.gray(" Use 'vibe-code clear' to delete all reports"))
}

function formatFileSize(bytes: number): string {
  const sizes = ["B", "KB", "MB", "GB"]
  if (bytes === 0) return "0 B"
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i]
}

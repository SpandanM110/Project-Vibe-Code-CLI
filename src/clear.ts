import fs from "fs-extra"
import path from "path"
import chalk from "chalk"
import inquirer from "inquirer"
import ora from "ora"

export async function clearReports(force = false): Promise<void> {
  const outputDir = path.join(process.cwd(), ".vibe-output")

  // Check if output directory exists
  const exists = await fs.pathExists(outputDir)

  if (!exists) {
    console.log(chalk.yellow("📁 No reports found to clear."))
    console.log(chalk.gray(`Looking for: ${outputDir}`))
    return
  }

  // Get list of files in output directory
  const files = await fs.readdir(outputDir)

  if (files.length === 0) {
    console.log(chalk.yellow("📁 Output directory is already empty."))
    return
  }

  console.log(chalk.blue("🗑️  Clear Reports"))
  console.log(chalk.gray(`Found ${files.length} files in .vibe-output/\n`))

  // Show what will be deleted
  console.log(chalk.yellow("Files to be deleted:"))
  for (const file of files) {
    const filePath = path.join(outputDir, file)
    const stats = await fs.stat(filePath)
    const size = formatFileSize(stats.size)
    console.log(chalk.gray(`  • ${file} (${size})`))
  }
  console.log()

  // Ask for confirmation unless force flag is used
  if (!force) {
    const answer = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: "Are you sure you want to delete all reports?",
        default: false,
      },
    ])

    if (!answer.confirm) {
      console.log(chalk.yellow("❌ Operation cancelled."))
      return
    }
  }

  // Delete files with spinner
  const spinner = ora("Clearing reports...").start()

  try {
    await fs.remove(outputDir)
    spinner.succeed(chalk.green("✅ All reports cleared successfully!"))

    console.log(chalk.gray(`\n📊 Deleted ${files.length} files`))
    console.log(chalk.gray(`📁 Removed directory: ${outputDir}`))
  } catch (error) {
    spinner.fail(chalk.red("❌ Failed to clear reports"))
    throw error
  }
}

function formatFileSize(bytes: number): string {
  const sizes = ["B", "KB", "MB", "GB"]
  if (bytes === 0) return "0 B"
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i]
}

import fs from "fs-extra"
import path from "path"
import { glob } from "glob"
import type { FileInfo } from "./types.js"

const IGNORE_PATTERNS = [
  "node_modules/**",
  ".git/**",
  "dist/**",
  "build/**",
  ".next/**",
  "coverage/**",
  "*.log",
  ".env*",
  "*.lock",
  "yarn.lock",
  "package-lock.json",
]

const IMPORTANT_EXTENSIONS = [
  ".js",
  ".ts",
  ".jsx",
  ".tsx",
  ".vue",
  ".py",
  ".go",
  ".rs",
  ".java",
  ".json",
  ".md",
  ".yml",
  ".yaml",
  ".toml",
  ".config.js",
  ".config.ts",
]

export async function scanRepository(): Promise<FileInfo[]> {
  const cwd = process.cwd()

  // Get all files, excluding ignored patterns
  const allFiles = await glob("**/*", {
    cwd,
    ignore: IGNORE_PATTERNS,
    nodir: true,
    dot: false,
  })

  const files: FileInfo[] = []

  for (const filePath of allFiles) {
    const fullPath = path.join(cwd, filePath)
    const stats = await fs.stat(fullPath)

    // Skip large files (>1MB)
    if (stats.size > 1024 * 1024) continue

    const extension = path.extname(filePath)

    // Prioritize important files
    const isImportant =
      IMPORTANT_EXTENSIONS.includes(extension) ||
      filePath.includes("package.json") ||
      filePath.includes("README") ||
      filePath.includes("config")

    if (isImportant || files.length < 50) {
      try {
        const content = await fs.readFile(fullPath, "utf-8")

        files.push({
          path: filePath,
          content,
          size: stats.size,
          extension,
        })
      } catch (error) {
        // Skip files that can't be read as text
        continue
      }
    }
  }

  return files.sort((a, b) => {
    // Sort by importance and size
    const aImportant = IMPORTANT_EXTENSIONS.includes(a.extension)
    const bImportant = IMPORTANT_EXTENSIONS.includes(b.extension)

    if (aImportant && !bImportant) return -1
    if (!aImportant && bImportant) return 1

    return a.size - b.size
  })
}

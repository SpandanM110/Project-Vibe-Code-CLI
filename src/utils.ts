import fs from "fs-extra"
import path from "path"

export async function ensureOutputDir(): Promise<void> {
  const outputDir = path.join(process.cwd(), ".vibe-output")
  await fs.ensureDir(outputDir)
}

export function formatFileSize(bytes: number): string {
  const sizes = ["Bytes", "KB", "MB", "GB"]
  if (bytes === 0) return "0 Bytes"
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i]
}

export function getFileType(extension: string): string {
  const types: Record<string, string> = {
    ".js": "JavaScript",
    ".ts": "TypeScript",
    ".jsx": "React JSX",
    ".tsx": "React TSX",
    ".vue": "Vue Component",
    ".py": "Python",
    ".go": "Go",
    ".rs": "Rust",
    ".java": "Java",
    ".json": "JSON",
    ".md": "Markdown",
    ".yml": "YAML",
    ".yaml": "YAML",
  }

  return types[extension] || "Unknown"
}

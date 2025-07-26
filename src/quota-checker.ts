import chalk from "chalk"

export interface QuotaInfo {
  tier: "free" | "paid" | "unknown"
  dailyLimit: number
  minuteLimit: number
  estimatedUsage: number
}

export function estimateTokenUsage(files: any[]): number {
  // Rough estimation: 1 token ≈ 4 characters
  const totalChars = files.reduce((sum, file) => {
    return sum + Math.min(file.content.length, 2000) // Max content per file
  }, 0)

  const promptOverhead = 1000 // Base prompt tokens
  const estimatedTokens = Math.ceil((totalChars + promptOverhead) / 4)

  return estimatedTokens
}

export function checkQuotaLimits(files: any[], model: string): void {
  const estimatedTokens = estimateTokenUsage(files)

  console.log(chalk.blue("\n📊 Quota Usage Estimation:"))
  console.log(chalk.gray(`   Files to analyze: ${files.length}`))
  console.log(chalk.gray(`   Estimated tokens: ${estimatedTokens.toLocaleString()}`))
  console.log(chalk.gray(`   Model: ${model}`))

  // Free tier limits (approximate)
  const freeTierLimits = {
    dailyRequests: 1500,
    minuteRequests: 15,
    tokensPerMinute: 32000, // Approximate
  }

  if (estimatedTokens > freeTierLimits.tokensPerMinute) {
    console.log(chalk.yellow("\n⚠️  WARNING: High token usage detected"))
    console.log(chalk.gray("   This request might exceed free tier limits"))
    console.log(chalk.gray("   Consider analyzing fewer files or upgrading to paid tier"))
  } else {
    console.log(chalk.green("\n✅ Token usage looks reasonable for free tier"))
  }

  console.log(chalk.gray("\n💡 Free tier limits (approximate):"))
  console.log(chalk.gray(`   • ${freeTierLimits.dailyRequests} requests per day`))
  console.log(chalk.gray(`   • ${freeTierLimits.minuteRequests} requests per minute`))
  console.log(chalk.gray(`   • ${freeTierLimits.tokensPerMinute.toLocaleString()} tokens per minute`))
}

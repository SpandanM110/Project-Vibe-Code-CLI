import chalk from "chalk"

export function showQuotaHelp(): void {
  console.log(chalk.blue.bold("📊 Understanding Gemini API Quotas\n"))

  console.log(chalk.yellow("🆓 Free Tier Limits:"))
  console.log(chalk.gray("   • 15 requests per minute"))
  console.log(chalk.gray("   • 1,500 requests per day"))
  console.log(chalk.gray("   • 32,000 tokens per minute"))
  console.log(chalk.gray("   • 1,000,000 tokens per day\n"))

  console.log(chalk.yellow("⏰ Quota Reset Times:"))
  console.log(chalk.gray("   • Per-minute quotas: Reset every minute"))
  console.log(chalk.gray("   • Daily quotas: Reset at midnight UTC\n"))

  console.log(chalk.yellow("💡 Tips to Avoid Quota Issues:"))
  console.log(chalk.gray("   1. Use gemini-1.5-flash instead of gemini-1.5-pro (uses fewer tokens)"))
  console.log(chalk.gray("   2. Analyze smaller repositories or fewer files"))
  console.log(chalk.gray("   3. Wait between analyses if you hit minute limits"))
  console.log(chalk.gray("   4. Consider upgrading to paid tier for higher limits\n"))

  console.log(chalk.yellow("🔗 Useful Links:"))
  console.log(
    chalk.gray("   • Check quotas: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas"),
  )
  console.log(chalk.gray("   • Quota docs: https://ai.google.dev/gemini-api/docs/rate-limits"))
  console.log(chalk.gray("   • Billing setup: https://console.cloud.google.com/billing\n"))

  console.log(chalk.green("✅ Current Status: Run 'vibe-code' to check your quota usage"))
}

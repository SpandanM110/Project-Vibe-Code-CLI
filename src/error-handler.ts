import chalk from "chalk"

export interface GeminiErrorInfo {
  type: "quota_exceeded" | "rate_limit" | "invalid_key" | "model_unavailable" | "content_too_large" | "unknown"
  message: string
  suggestions: string[]
  retryAfter?: number
}

export function parseGeminiError(error: Error): GeminiErrorInfo {
  const errorMessage = error.message.toLowerCase()

  // Parse quota exceeded errors
  if (errorMessage.includes("exceeded your current quota") || errorMessage.includes("quotafailure")) {
    return parseQuotaError(error.message)
  }

  // Parse rate limit errors
  if (errorMessage.includes("429") && errorMessage.includes("rate_limit_exceeded")) {
    return parseRateLimitError(error.message)
  }

  // Parse authentication errors
  if (errorMessage.includes("401") || errorMessage.includes("api_key")) {
    return {
      type: "invalid_key",
      message: "Invalid or missing API key",
      suggestions: [
        "Check that your API key is correct",
        "Ensure your API key has the necessary permissions",
        "Get a new API key at: https://makersuite.google.com/app/apikey",
      ],
    }
  }

  // Parse content errors
  if (errorMessage.includes("400") || errorMessage.includes("content")) {
    return {
      type: "content_too_large",
      message: "Request content is too large or malformed",
      suggestions: [
        "Try analyzing a smaller repository",
        "Reduce the number of files being analyzed",
        "Use a different model that supports larger inputs",
      ],
    }
  }

  // Parse model availability errors
  if (errorMessage.includes("model") && errorMessage.includes("not found")) {
    return {
      type: "model_unavailable",
      message: "The selected model is not available",
      suggestions: [
        "Try a different model like gemini-1.5-flash",
        "Check if the model name is correct",
        "Some models may not be available in your region",
      ],
    }
  }

  return {
    type: "unknown",
    message: error.message,
    suggestions: [
      "Try again in a few minutes",
      "Check your internet connection",
      "Contact support if the issue persists",
    ],
  }
}

function parseQuotaError(errorMessage: string): GeminiErrorInfo {
  const suggestions: string[] = []
  let specificMessage = "You have exceeded your API quota limits"

  // Check for specific quota types
  if (errorMessage.includes("free_tier")) {
    specificMessage = "You have exceeded your free tier quota limits"
    suggestions.push("🆓 You're using the FREE tier of Gemini API")

    if (errorMessage.includes("input_token_count")) {
      suggestions.push("📊 Too many input tokens used (text sent to AI)")
      suggestions.push("💡 Try analyzing smaller files or fewer files at once")
    }

    if (errorMessage.includes("requests")) {
      suggestions.push("🔄 Too many requests made to the API")
      if (errorMessage.includes("PerMinute")) {
        suggestions.push("⏱️  Free tier: 15 requests per minute limit")
        suggestions.push("⏳ Wait 1-2 minutes before trying again")
      }
      if (errorMessage.includes("PerDay")) {
        suggestions.push("📅 Free tier: 1,500 requests per day limit")
        suggestions.push("🌅 Wait until tomorrow or upgrade to paid plan")
      }
    }

    suggestions.push("💳 Consider upgrading to a paid plan for higher limits")
    suggestions.push("🔗 Billing info: https://console.cloud.google.com/billing")
  } else {
    suggestions.push("💳 Check your billing and payment details")
    suggestions.push("📈 You may need to increase your quota limits")
  }

  // Extract retry delay if available
  let retryAfter: number | undefined
  const retryMatch = errorMessage.match(/retrydelay['":][\s]*['"]*(\d+)s/i)
  if (retryMatch) {
    retryAfter = Number.parseInt(retryMatch[1], 10)
    suggestions.push(`⏰ Suggested retry time: ${retryAfter} seconds`)
  }

  return {
    type: "quota_exceeded",
    message: specificMessage,
    suggestions,
    retryAfter,
  }
}

function parseRateLimitError(errorMessage: string): GeminiErrorInfo {
  const suggestions: string[] = []
  let specificMessage = "Rate limit exceeded"

  if (errorMessage.includes("requests per minute")) {
    specificMessage = "Too many requests per minute"
    suggestions.push("⏱️  You're making requests too quickly")
    suggestions.push("⏳ Wait 1-2 minutes before trying again")
  }

  if (errorMessage.includes("quota metric")) {
    suggestions.push("📊 API quota limits reached")
    suggestions.push("💡 Try using a lighter model like gemini-1.5-flash")
  }

  suggestions.push("🔄 The system will automatically retry with delays")

  return {
    type: "rate_limit",
    message: specificMessage,
    suggestions,
  }
}

export function displayError(errorInfo: GeminiErrorInfo): void {
  console.log(chalk.red(`\n❌ ${errorInfo.message}`))

  if (errorInfo.type === "quota_exceeded") {
    console.log(chalk.yellow("\n🚫 QUOTA EXCEEDED - Here's what happened:"))
  } else if (errorInfo.type === "rate_limit") {
    console.log(chalk.yellow("\n⏱️  RATE LIMITED - Here's what happened:"))
  } else {
    console.log(chalk.yellow("\n⚠️  ERROR DETAILS:"))
  }

  errorInfo.suggestions.forEach((suggestion, index) => {
    console.log(chalk.gray(`   ${index + 1}. ${suggestion}`))
  })

  if (errorInfo.retryAfter) {
    console.log(chalk.blue(`\n⏰ Recommended wait time: ${errorInfo.retryAfter} seconds`))
  }

  console.log(chalk.gray("\n💡 Need help? Visit: https://ai.google.dev/gemini-api/docs/rate-limits"))
}

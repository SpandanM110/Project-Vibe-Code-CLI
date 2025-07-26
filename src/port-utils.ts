import { createServer } from "net"
import chalk from "chalk"

export async function findAvailablePort(startPort = 2000, maxAttempts = 10): Promise<number> {
  for (let port = startPort; port < startPort + maxAttempts; port++) {
    if (await isPortAvailable(port)) {
      return port
    }
  }
  throw new Error(`No available ports found in range ${startPort}-${startPort + maxAttempts - 1}`)
}

export async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer()

    server.listen(port, () => {
      server.once("close", () => {
        resolve(true)
      })
      server.close()
    })

    server.on("error", () => {
      resolve(false)
    })
  })
}

export function getPortSuggestions(currentPort: number): number[] {
  const suggestions = [3000, 3001, 4000, 5000, 8000, 8080, 9000]
  return suggestions.filter((port) => port !== currentPort)
}

export async function promptForPort(defaultPort = 2000): Promise<number> {
  const inquirer = await import("inquirer")

  console.log(chalk.yellow(`⚠️  Port ${defaultPort} is already in use.`))

  const availablePorts = []
  const suggestions = getPortSuggestions(defaultPort)

  // Check which suggested ports are available
  for (const port of suggestions.slice(0, 5)) {
    if (await isPortAvailable(port)) {
      availablePorts.push(port)
    }
  }

  if (availablePorts.length > 0) {
    console.log(chalk.gray(` Available ports found: ${availablePorts.join(", ")}`))

    const choices = [
      ...availablePorts.map((port) => ({
        name: `Port ${port} (Available)`,
        value: port,
      })),
      {
        name: "Let me choose a custom port",
        value: "custom",
      },
      {
        name: "Find next available port automatically",
        value: "auto",
      },
    ]

    const answer = await inquirer.default.prompt([
      {
        type: "list",
        name: "portChoice",
        message: "Which port would you like to use?",
        choices,
        default: availablePorts[0],
      },
    ])

    if (answer.portChoice === "custom") {
      return await promptForCustomPort()
    } else if (answer.portChoice === "auto") {
      return await findAvailablePort(defaultPort + 1)
    } else {
      return answer.portChoice
    }
  } else {
    // No suggested ports available, offer custom or auto
    const answer = await inquirer.default.prompt([
      {
        type: "list",
        name: "portChoice",
        message: "How would you like to choose a port?",
        choices: [
          {
            name: "Find next available port automatically",
            value: "auto",
          },
          {
            name: "Let me choose a custom port",
            value: "custom",
          },
        ],
        default: "auto",
      },
    ])

    if (answer.portChoice === "custom") {
      return await promptForCustomPort()
    } else {
      return await findAvailablePort(defaultPort + 1)
    }
  }
}

async function promptForCustomPort(): Promise<number> {
  const inquirer = await import("inquirer")

  const answer = await inquirer.default.prompt([
    {
      type: "input",
      name: "customPort",
      message: "Enter a custom port number:",
      default: "3000",
      validate: async (input: string) => {
        const port = Number.parseInt(input, 10)

        if (isNaN(port) || port < 1024 || port > 65535) {
          return "Please enter a valid port number between 1024 and 65535"
        }

        const available = await isPortAvailable(port)
        if (!available) {
          return `Port ${port} is already in use. Please choose another port.`
        }

        return true
      },
    },
  ])

  return Number.parseInt(answer.customPort, 10)
}

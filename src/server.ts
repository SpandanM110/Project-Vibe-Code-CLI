import express from "express"
import path from "path"
import chalk from "chalk"
import open from "open"
import type { ProjectReport } from "./types.js"
import { isPortAvailable, promptForPort } from "./port-utils.js"

export async function startServer(report: ProjectReport, preferredPort = 2000): Promise<void> {
  const app = express()
  let PORT = preferredPort

  // Check if preferred port is available
  const isPreferredPortAvailable = await isPortAvailable(preferredPort)

  if (!isPreferredPortAvailable) {
    try {
      // Try to find an available port or prompt user
      PORT = await promptForPort(preferredPort)
    } catch (error) {
      console.log(chalk.red("❌ Could not find an available port."))
      console.log(chalk.gray("💡 Try closing other applications or specify a different port."))
      throw error
    }
  }

  // Serve static files
  app.use("/static", express.static(path.join(process.cwd(), ".vibe-output")))

  // Main report page
  app.get("/", (req, res) => {
    const html = generateCleanReportHTML(report, PORT)
    res.send(html)
  })

  // API endpoint for report data
  app.get("/api/report", (req, res) => {
    res.json(report)
  })

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.json({ status: "ok", port: PORT, timestamp: new Date().toISOString() })
  })

  // Start server with error handling
  const server = app.listen(PORT, () => {
    console.log(chalk.green(`\n🌐 Report server started successfully!`))

    if (PORT !== preferredPort) {
      console.log(chalk.yellow(`📍 Using port ${PORT} (${preferredPort} was unavailable)`))
    }

    console.log(chalk.blue(`📊 View your report at: http://localhost:${PORT}`))
    console.log(chalk.gray(`📁 Report files saved in: .vibe-output/`))
    console.log(chalk.gray(`💡 Press Ctrl+C to stop the server\n`))

    // Auto-open browser
    open(`http://localhost:${PORT}`)
  })

  // Handle server errors
  server.on("error", (error: any) => {
    if (error.code === "EADDRINUSE") {
      console.log(chalk.red(`❌ Port ${PORT} is already in use.`))
      console.log(chalk.gray("💡 This shouldn't happen as we checked availability. Try restarting."))
    } else {
      console.log(chalk.red(`❌ Server error: ${error.message}`))
    }
    process.exit(1)
  })

  // Graceful shutdown
  process.on("SIGINT", () => {
    console.log(chalk.yellow("\n👋 Shutting down server..."))
    server.close(() => {
      console.log(chalk.green("✅ Server closed successfully"))
      process.exit(0)
    })
  })

  // Handle uncaught exceptions
  process.on("uncaughtException", (error) => {
    console.log(chalk.red("\n❌ Uncaught Exception:"), error.message)
    server.close(() => {
      process.exit(1)
    })
  })
}

function generateCleanReportHTML(report: ProjectReport, PORT: number): string {
  // Parse the AI summary to extract structured information
  const parsedSummary = parseAISummary(report.geminiSummary)

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${report.projectName} - Code Analysis Report</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
            line-height: 1.6;
        }
        
        .container { 
            max-width: 1400px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 20px; 
            box-shadow: 0 25px 50px rgba(0,0,0,0.15);
            overflow: hidden;
        }
        
        .header { 
            background: linear-gradient(135deg, #2563eb, #1d4ed8); 
            color: white; 
            padding: 50px 40px; 
            text-align: center;
            position: relative;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
        }
        
        .header-content { position: relative; z-index: 1; }
        .header h1 { font-size: 3rem; margin-bottom: 15px; font-weight: 700; }
        .header p { opacity: 0.9; font-size: 1.2rem; max-width: 600px; margin: 0 auto; }
        
        .nav-tabs {
            background: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
            padding: 0 40px;
            display: flex;
            gap: 0;
        }
        
        .nav-tab {
            padding: 15px 25px;
            background: none;
            border: none;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            color: #64748b;
            border-bottom: 3px solid transparent;
            transition: all 0.2s;
        }
        
        .nav-tab.active {
            color: #2563eb;
            border-bottom-color: #2563eb;
            background: white;
        }
        
        .nav-tab:hover {
            color: #2563eb;
            background: rgba(37, 99, 235, 0.05);
        }
        
        .content { padding: 40px; }
        
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        
        .stats-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
            gap: 25px; 
            margin-bottom: 40px; 
        }
        
        .stat-card { 
            background: linear-gradient(135deg, #f8fafc, #f1f5f9);
            padding: 30px; 
            border-radius: 16px; 
            text-align: center; 
            border: 1px solid #e2e8f0;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .stat-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        
        .stat-icon {
            font-size: 2.5rem;
            margin-bottom: 15px;
            color: #2563eb;
        }
        
        .stat-number { 
            font-size: 2.5rem; 
            font-weight: 700; 
            color: #1e293b; 
            margin-bottom: 5px;
        }
        
        .stat-label { 
            color: #64748b; 
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .section { margin-bottom: 50px; }
        
        .section-title { 
            color: #1e293b; 
            font-size: 1.8rem; 
            margin-bottom: 25px; 
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .section-icon {
            color: #2563eb;
            font-size: 1.5rem;
        }
        
        .tech-stack { 
            display: flex; 
            flex-wrap: wrap; 
            gap: 12px; 
            margin-bottom: 30px; 
        }
        
        .tech-tag { 
            background: linear-gradient(135deg, #dbeafe, #bfdbfe);
            color: #1e40af; 
            padding: 10px 18px; 
            border-radius: 25px; 
            font-size: 14px; 
            font-weight: 500;
            border: 1px solid #93c5fd;
            transition: all 0.2s;
        }
        
        .tech-tag:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
        }
        
        .file-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 20px;
        }
        
        .file-card { 
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px; 
            padding: 20px;
            transition: all 0.2s;
        }
        
        .file-card:hover {
            border-color: #2563eb;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1);
        }
        
        .file-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
        }
        
        .file-icon {
            color: #2563eb;
            font-size: 1.2rem;
        }
        
        .file-path { 
            font-family: 'Monaco', 'Menlo', 'Consolas', monospace; 
            color: #1e293b;
            font-weight: 600;
            font-size: 14px;
        }
        
        .file-purpose { 
            color: #64748b; 
            font-size: 14px;
            line-height: 1.5;
        }
        
        .importance-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .importance-high {
            background: #fee2e2;
            color: #dc2626;
        }
        
        .structure-container {
            background: #1e293b;
            border-radius: 12px;
            padding: 25px;
            overflow-x: auto;
        }
        
        .structure-pre { 
            color: #e2e8f0;
            font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
            font-size: 14px;
            line-height: 1.6;
            margin: 0;
            white-space: pre;
        }
        
        .summary-container {
            background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
            border: 1px solid #0ea5e9;
            border-radius: 16px;
            padding: 30px;
        }
        
        .summary-content {
            color: #0c4a6e;
            line-height: 1.8;
            font-size: 15px;
        }
        
        .summary-content h1, .summary-content h2, .summary-content h3 {
            color: #0c4a6e;
            margin: 20px 0 10px 0;
        }
        
        .summary-content ul, .summary-content ol {
            margin: 15px 0;
            padding-left: 25px;
        }
        
        .summary-content li {
            margin: 8px 0;
        }
        
        .summary-content strong {
            color: #075985;
        }
        
        .footer { 
            background: #f8fafc; 
            padding: 30px 40px; 
            text-align: center; 
            color: #64748b; 
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 20px;
        }
        
        .footer-info {
            display: flex;
            align-items: center;
            gap: 20px;
            flex-wrap: wrap;
        }
        
        .footer-badge {
            background: #2563eb;
            color: white;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
        }
        
        .server-info {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 12px;
            z-index: 1000;
            backdrop-filter: blur(10px);
        }
        
        @media (max-width: 768px) {
            .container { margin: 10px; border-radius: 12px; }
            .header { padding: 30px 20px; }
            .header h1 { font-size: 2rem; }
            .content { padding: 20px; }
            .nav-tabs { padding: 0 20px; }
            .file-grid { grid-template-columns: 1fr; }
            .stats-grid { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
        }
    </style>
</head>
<body>
    <div class="server-info">
        <i class="fas fa-server"></i> localhost:${PORT}
    </div>
    
    <div class="container">
        <div class="header">
            <div class="header-content">
                <h1><i class="fas fa-code"></i> ${report.projectName}</h1>
                <p>${report.description}</p>
            </div>
        </div>
        
        <div class="nav-tabs">
            <button class="nav-tab active" onclick="showTab('overview')">
                <i class="fas fa-chart-line"></i> Overview
            </button>
            <button class="nav-tab" onclick="showTab('files')">
                <i class="fas fa-folder-open"></i> Key Files
            </button>
            <button class="nav-tab" onclick="showTab('structure')">
                <i class="fas fa-sitemap"></i> Structure
            </button>
            <button class="nav-tab" onclick="showTab('analysis')">
                <i class="fas fa-brain"></i> AI Analysis
            </button>
        </div>
        
        <div class="content">
            <!-- Overview Tab -->
            <div id="overview" class="tab-content active">
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-file-code"></i></div>
                        <div class="stat-number">${report.totalFiles}</div>
                        <div class="stat-label">Total Files</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-code"></i></div>
                        <div class="stat-number">${report.totalLines.toLocaleString()}</div>
                        <div class="stat-label">Lines of Code</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-layer-group"></i></div>
                        <div class="stat-number">${report.techStack.length}</div>
                        <div class="stat-label">Technologies</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-star"></i></div>
                        <div class="stat-number">${report.keyFiles.length}</div>
                        <div class="stat-label">Key Files</div>
                    </div>
                </div>

                <div class="section">
                    <h2 class="section-title">
                        <i class="fas fa-tools section-icon"></i>
                        Technology Stack
                    </h2>
                    <div class="tech-stack">
                        ${report.techStack.map((tech) => `<span class="tech-tag">${tech}</span>`).join("")}
                    </div>
                </div>
            </div>

            <!-- Key Files Tab -->
            <div id="files" class="tab-content">
                <div class="section">
                    <h2 class="section-title">
                        <i class="fas fa-folder-open section-icon"></i>
                        Important Files
                    </h2>
                    <div class="file-grid">
                        ${report.keyFiles
                          .map(
                            (file) => `
                            <div class="file-card">
                                <div class="file-header">
                                    <i class="fas fa-file-code file-icon"></i>
                                    <span class="file-path">${file.path}</span>
                                    <span class="importance-badge importance-${file.importance}">${file.importance}</span>
                                </div>
                                <div class="file-purpose">${file.purpose}</div>
                            </div>
                        `,
                          )
                          .join("")}
                    </div>
                </div>
            </div>

            <!-- Structure Tab -->
            <div id="structure" class="tab-content">
                <div class="section">
                    <h2 class="section-title">
                        <i class="fas fa-sitemap section-icon"></i>
                        Project Structure
                    </h2>
                    <div class="structure-container">
                        <pre class="structure-pre">${report.structure}</pre>
                    </div>
                </div>
            </div>

            <!-- AI Analysis Tab -->
            <div id="analysis" class="tab-content">
                <div class="section">
                    <h2 class="section-title">
                        <i class="fas fa-brain section-icon"></i>
                        AI-Powered Analysis
                    </h2>
                    <div class="summary-container">
                        <div class="summary-content">
                            ${formatAISummary(report.geminiSummary)}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="footer">
            <div class="footer-info">
                <span>Generated by <strong>vibe-code</strong></span>
                <span class="footer-badge">${report.modelUsed}</span>
                <span class="footer-badge">${report.modelType} mode</span>
            </div>
            <div>
                <i class="fas fa-clock"></i>
                ${new Date(report.generatedAt).toLocaleString()}
            </div>
        </div>
    </div>

    <script>
        function showTab(tabName) {
            // Hide all tab contents
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Remove active class from all nav tabs
            document.querySelectorAll('.nav-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Show selected tab content
            document.getElementById(tabName).classList.add('active');
            
            // Add active class to clicked nav tab
            event.target.classList.add('active');
        }
        
        // Add smooth scrolling and animations
        document.addEventListener('DOMContentLoaded', function() {
            // Animate stat cards on load
            const statCards = document.querySelectorAll('.stat-card');
            statCards.forEach((card, index) => {
                setTimeout(() => {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(20px)';
                    card.style.transition = 'all 0.5s ease';
                    
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, 100);
                }, index * 100);
            });
        });
    </script>
</body>
</html>`
}

function parseAISummary(summary: string): any {
  // This function could be enhanced to parse structured information from the AI summary
  return {
    purpose: extractSection(summary, "purpose"),
    architecture: extractSection(summary, "architecture"),
    features: extractSection(summary, "features"),
  }
}

function extractSection(text: string, sectionName: string): string {
  const regex = new RegExp(`\\*\\*.*${sectionName}.*\\*\\*:?([^*]+)`, "i")
  const match = text.match(regex)
  return match ? match[1].trim() : ""
}

function formatAISummary(summary: string): string {
  // Convert markdown-like formatting to HTML
  let formatted = summary
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/^### (.*$)/gm, "<h3>$1</h3>")
    .replace(/^## (.*$)/gm, "<h2>$1</h2>")
    .replace(/^# (.*$)/gm, "<h1>$1</h1>")
    .replace(/^\* (.*$)/gm, "<li>$1</li>")
    .replace(/^\d+\. (.*$)/gm, "<li>$1</li>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<[h|l|p])/gm, "<p>")
    .replace(/(?<!>)$/gm, "</p>")

  // Wrap consecutive <li> elements in <ul>
  formatted = formatted.replace(/(<li>.*?<\/li>)(\s*<li>.*?<\/li>)*/gs, "<ul>$&</ul>")

  return formatted
}

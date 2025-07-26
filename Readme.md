# vibe-code

[![npm version](https://badge.fury.io/js/@simple-build%2Fvibe-code.svg)](https://www.npmjs.com/package/@simple-build/vibe-code)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)

**AI-powered CLI tool that analyzes codebases and generates comprehensive project reports using Google's Gemini LLMs**

Transform any codebase into a beautiful, interactive analysis report in seconds! 🎯

<video controls src="NPM-Demo1.mp4" title="Title"></video>


**🎥 [Watch the full demo on YouTube →](https://www.youtube.com/watch?v=50ObPdkCrag)**
## ✨ Features

- 🤖 **AI-Powered Analysis**: Leverages Google's Gemini LLMs for intelligent code understanding
- 📊 **Interactive Dashboard**: Beautiful web interface with tabbed navigation and responsive design
- 🔍 **Smart File Detection**: Automatically identifies important files and architectural patterns
- 🌐 **Local Web Server**: Serves reports on localhost with auto-open browser functionality
- 📁 **Multiple Export Formats**: Saves reports as JSON, Markdown, and HTML
- ⚡ **Fast & Efficient**: Optimized for repositories of any size with intelligent file filtering
- 🛡️ **Robust Error Handling**: Comprehensive error handling with helpful suggestions and fallback modes
- 🔄 **Fallback Mode**: Basic analysis when AI is unavailable or quota exceeded
- 💾 **Report Management**: List, serve, and clear generated reports with simple commands
- 🎨 **Professional UI**: Clean, modern interface with syntax highlighting and interactive elements

## 🚀 Quick Start

### Installation

```bash
# Install globally via npm
npm install -g vibe-code

# Or use with npx (no installation required)
npx vibe-code
```

### Basic Usage

```bash
# Navigate to your project
cd your-awesome-project

# Run analysis (opens interactive report)
vibe-code

# That's it! 🎉
```

## 📖 Commands Reference

| Command | Description | Example |
|---------|-------------|---------|
| `vibe-code` | Analyze current repository (default) | `vibe-code` |
| `vibe-code analyze` | Analyze with options | `vibe-code analyze -p 3000` |
| `vibe-code serve` | Serve existing reports | `vibe-code serve -p 4000` |
| `vibe-code list` | List generated reports | `vibe-code list` |
| `vibe-code clear` | Clear all reports | `vibe-code clear -f` |
| `vibe-code help` | Show detailed help | `vibe-code help` |

### Command Options

```bash
# Specify custom port
vibe-code --port 3000
vibe-code -p 8080

# Force clear without confirmation
vibe-code clear --force
vibe-code clear -f

# Get help and version info
vibe-code --help
vibe-code --version
```

## 🔧 Setup Guide

### 1. Get Your Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key (free tier available with generous limits)
4. Copy your API key for use with vibe-code

### 2. Run Your First Analysis

```bash
# Navigate to any project directory
cd my-project

# Start the analysis
vibe-code
```

You'll be prompted to:
- **Select a Gemini model** (recommended: `gemini-1.5-flash` for speed and efficiency)
- **Enter your API key** (paste the key from step 1)
- **Choose analysis options** (standard or advanced mode)

### 3. View Your Report

The tool automatically:
- ✅ Analyzes your codebase intelligently
- ✅ Generates a comprehensive report
- ✅ Opens an interactive dashboard in your browser
- ✅ Saves reports in `.vibe-output/` directory for future reference

##  What You Get

###  Project Overview Dashboard
- **AI-Generated Summary**: Intelligent project description and purpose analysis
- **Technology Stack Detection**: Automatically identified frameworks, libraries, and tools
- **Key Statistics**: File counts, lines of code, project complexity metrics
- **Project Health Insights**: Code quality observations and recommendations

###  Intelligent File Analysis
- **Important Files Detection**: Auto-identified critical files with importance ranking
- **File Purpose Explanations**: AI-generated descriptions of each file's role
- **Code Structure Visualization**: Clear project organization and architecture overview
- **Dependency Analysis**: Package and import relationship mapping

###  AI-Powered Insights
- **Architecture Analysis**: Deep understanding of how your project is structured
- **Best Practices Assessment**: Code quality observations and industry standard compliance
- **Improvement Suggestions**: AI-powered recommendations for optimization
- **Technology Assessment**: Framework and tool evaluation with modern alternatives

### 📱 Interactive Dashboard Features
- **Tabbed Interface**: Easy navigation between Overview, Files, Structure, and AI Analysis
- **Responsive Design**: Perfect experience on desktop, tablet, and mobile devices
- **Professional Styling**: Clean, modern interface with syntax highlighting
- **Export Options**: Multiple format support (JSON, Markdown, HTML)
- **Search & Filter**: Quick navigation through large codebases
- **Dark/Light Mode**: Comfortable viewing in any environment


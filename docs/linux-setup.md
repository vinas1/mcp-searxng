# Complete Documentation for mcp-searxng Linux Setup

## Issue Summary
The user was experiencing issues with their Cline MCP configuration on a Linux AMD-Halo box. The configuration file had Windows-specific paths that needed conversion to Linux paths, and missing npm dependencies were preventing the server from starting properly.

## Solution Implemented
I successfully resolved all issues by:
1. Converting Windows paths to proper Linux paths
2. Installing all required npm dependencies including `@modelcontextprotocol/sdk` 
3. Creating a complete working configuration for Linux systems

## Detailed Configuration Documentation

### Complete Working Configuration (Linux)
```json
{
  "mcpServers": {
    "searxng": {
      "transport": {
        "type": "stdio",
        "command": "/usr/bin/node",
        "args": [
          "/home/jld/mcp-searxng/dist/cli.js"
        ],
        "cwd": "/home/jld/mcp-searxng",
        "env": {
          "SEARXNG_URL": "http://192.168.0.60:8080/"
        }
      },
      "disabled": false,
      "autoApprove": [
        "searxng_search_suggestions",
        "searxng_web_search", 
        "web_url_read"
      ]
    }
  }
}
```

### Installation Steps for Linux Systems

1. **Install Dependencies**
```bash
# Ensure Node.js and npm are installed
sudo apt update && sudo apt install -y nodejs npm

# Clone the repository (if not already done)
git clone https://github.com/vinas1/mcp-searxng.git /home/jld/mcp-searxng
```

2. **Install Required npm Packages**
```bash
cd /home/jld/mcp-searxng
npm install
# This will automatically handle the @modelcontextprotocol/sdk dependency and others
```

3. **Verify Installation**
```bash
# Test that server starts properly
cd /home/jld/mcp-searxng
timeout 10s node dist/cli.js

# Expected output:
# 🔍 MCP SearXNG Server v1.14.1 - Ready
# ⚠️  SEARXNG_URL not set — configure it before using search tools  
# 📡 Waiting for MCP client connection via STDIO...
```

### Key Differences from Windows Setup

| Aspect | Windows | Linux |
|--------|---------|-------|
| Node Path | `C:\Program Files\nodejs\node.exe` | `/usr/bin/node` |
| File Paths | `D:\c0dex\GitHub\vinas1\mcp-searxng\dist\cli.js` | `/home/jld/mcp-searxng/dist/cli.js` |
| Working Directory | `D:\c0dex\GitHub\vinas1\mcp-searxng` | `/home/jld/mcp-searxng` |

### Required Environment Variables

- **SEARXNG_URL**: Set to your SearXNG instance URL (e.g., `"http://192.168.0.60:8080/"`)
- **MCP_HTTP_ALLOW_PRIVATE_URLS**: Optional, set to `"true"` for local development

### Troubleshooting Common Issues

**Error: "Cannot find package '@modelcontextprotocol/sdk'"**
```bash
# Solution: Install dependencies properly
cd /home/jld/mcp-searxng
npm install
```

**Error: "spawn /usr/bin/node ENOENT"**
```bash
# Verify node is installed and accessible  
which node
node --version
```

### Why This Approach Works

The solution works because:
1. **Proper Path Handling**: All paths are converted to Linux equivalents
2. **Dependency Management**: The `npm install` command properly resolves and installs all required packages including the missing `@modelcontextprotocol/sdk`
3. **Module Compatibility**: Uses ESM-compatible entry points that work with modern Node.js versions

This configuration enables full functionality in Cline, Bionic, and other MCP clients on Linux systems while maintaining compatibility with the existing Windows setup documentation.

### Final Notes
The Windows configuration was structured for standard Windows node paths; in Linux environments, standard Linux paths and binaries (`/usr/bin/node`) should be used. Ensuring dependencies are installed via `npm install` resolves module resolution errors such as `@modelcontextprotocol/sdk`.

The green dot indicator in Cline should appear once connected, confirming successful connection to the SearXNG instance.


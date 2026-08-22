# Connect Bionic to `mcp-searxng`

This guide configures Bionic to run the `mcp-searxng` MCP server on Windows.

- **Remote method:** Bionic fetches and runs the MCP from GitHub.
- **Local method:** Bionic runs an existing local clone.

## Prerequisites

- Node.js and npm installed.
- Bionic installed.
- Access to a working SearXNG instance.
- Repository: `https://github.com/vinas1/mcp-searxng`

The examples below use:

```text
SEARXNG_URL=http://deb-k3s:8080/
```

Replace that URL if your SearXNG instance is elsewhere.

---

# Option 1 — Run Directly from GitHub

Use this method when you want Bionic to fetch the MCP from the GitHub repository.

## 1. Confirm the repository is ready

The repository's `package.json` must contain:

```json
"bin": {
  "mcp-searxng": "dist/cli.js"
}
```

It also needs a build step for Git-based installation:

```json
"scripts": {
  "build": "tsc && shx chmod +x dist/*.js",
  "prepare": "npm run build"
}
```

Commit and push those changes before continuing.

## 2. Test from PowerShell

```powershell
$env:SEARXNG_URL = "http://deb-k3s:8080/"
$env:MCP_HTTP_ALLOW_PRIVATE_URLS = "true"

npm exec `
  --allow-git=all `
  --allow-remote=all `
  --yes `
  --package=github:vinas1/mcp-searxng `
  -- mcp-searxng
```

Success looks like:

```text
MCP SearXNG Server v1.14.1 - Ready
SearXNG URLs: http://deb-k3s:8080/
Waiting for MCP client connection via STDIO...
```

Press `Ctrl+C` after the test.

## 3. Configure Bionic

Create or edit the MCP connection.

### Connection

```text
On this computer
```

### Command

```text
C:\Program Files\nodejs\npm.cmd
```

### Arguments

Add each of these as a **separate argument**, in this order:

```text
exec
```

```text
--allow-git=all
```

```text
--allow-remote=all
```

```text
--yes
```

```text
--package=github:vinas1/mcp-searxng
```

```text
--
```

```text
mcp-searxng
```

> Important: `--` and `mcp-searxng` must be two separate arguments.

### Environment variables

```text
SEARXNG_URL=http://deb-k3s:8080/
```

```text
MCP_HTTP_ALLOW_PRIVATE_URLS=true
```

### Working directory

Leave it blank.

## 4. Start the connection

Toggle the MCP connection off and back on.

Expected status:

```text
Connected · 4 tools ready
```

## Remote method troubleshooting

### `EALLOWGIT`

Use:

```text
--allow-git=all
```

Do not use:

```text
--allow-git-all
```

### `EALLOWREMOTE`

Keep this argument:

```text
--allow-remote=all
```

### `Connection closed`

Check the following:

- Command is `npm.cmd`, not `npx.cmd`.
- `--` is its own argument.
- `mcp-searxng` is its own argument.
- The package `bin` entry points to `dist/cli.js`, not `dist/index.js`.
- The PowerShell test works before testing in Bionic.

---

# Option 2 — Run a Local Clone

Use this method when the repository is already cloned and built on the computer.

## 1. Clone and build

```powershell
New-Item -ItemType Directory -Force "D:\c0dex\GitHub\vinas1" | Out-Null
Set-Location "D:\c0dex\GitHub\vinas1"

git clone https://github.com/vinas1/mcp-searxng.git
Set-Location ".\mcp-searxng"

npm install
npm run build
```

## 2. Test the local MCP

```powershell
Set-Location "D:\c0dex\GitHub\vinas1\mcp-searxng"

$env:SEARXNG_URL = "http://deb-k3s:8080/"
$env:MCP_HTTP_ALLOW_PRIVATE_URLS = "true"

node .\dist\cli.js
```

Success looks like:

```text
MCP SearXNG Server v1.14.1 - Ready
SearXNG URLs: http://deb-k3s:8080/
Waiting for MCP client connection via STDIO...
```

Press `Ctrl+C` after the test.

## 3. Configure Bionic

### Connection

```text
On this computer
```

### Command

```text
C:\Program Files\nodejs\node.exe
```

### Argument

Add this single argument:

```text
D:\c0dex\GitHub\vinas1\mcp-searxng\dist\cli.js
```

### Environment variables

```text
SEARXNG_URL=http://deb-k3s:8080/
```

```text
MCP_HTTP_ALLOW_PRIVATE_URLS=true
```

### Working directory

```text
D:\c0dex\GitHub\vinas1\mcp-searxng
```

## 4. Start the connection

Toggle the MCP connection off and back on.

Expected status:

```text
Connected · 4 tools ready
```

## Update the local copy

Run updates manually:

```powershell
Set-Location "D:\c0dex\GitHub\vinas1\mcp-searxng"

git pull
npm install
npm run build
```

Then restart the MCP connection in Bionic.

## Local method troubleshooting

### Node exits immediately with no output

Make sure Bionic runs:

```text
dist\cli.js
```

Do not run:

```text
dist\index.js
```

`dist\cli.js` starts the STDIO MCP server. `dist\index.js` is the library entry point and exits when run directly.

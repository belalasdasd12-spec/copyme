# Setup for the measuring tools

## Browser-control MCP servers (Claude Code)

```bash
claude mcp add --scope user chrome-devtools -- npx -y chrome-devtools-mcp@latest
claude mcp add --scope user playwright -- npx -y @playwright/mcp@latest
```

Pin exact versions instead of `latest` if you prefer reproducible installs. Restart Claude Code (or start a new
session) so the tools load. Both need Node 20+ and Google Chrome.

## Script dependencies

```bash
npm i --prefix ~/.claude/skills/copyme/scripts      # playwright-core
python3 -m pip install --user pillow                  # for pair.py
```

Scripts use the installed Google Chrome (`channel: "chrome"`). Override with `CHROME_PATH=/path/to/chrome`.
If Chrome isn't installed: `npx playwright install chromium` and set `CHROME_CHANNEL=bundled`.

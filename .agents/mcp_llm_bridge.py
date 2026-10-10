import sys
import argparse
try:
    from mcp.server.fastmcp import FastMCP
except (ImportError, ModuleNotFoundError):
    from mcp.server.mcpserver import MCPServer as FastMCP
from openai import OpenAI

parser = argparse.ArgumentParser(description="LM Studio MCP Bridge")
parser.add_argument("--name", default="lmstudio-bridge", help="Server name")
parser.add_argument("--base-url", required=True, help="LM Studio base URL")
args = parser.parse_args()

mcp = FastMCP(args.name)
client = OpenAI(base_url=args.base_url, api_key="lm-studio")

@mcp.tool()
def chat_completion(prompt: str, system_prompt: str = "You are a helpful coding assistant.") -> str:
    """Send a prompt and return completions from this LM Studio endpoint."""
    models = client.models.list()
    model_id = models.data[0].id if models.data else "default"
    response = client.chat.completions.create(
        model=model_id,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        temperature=0.2,
    )
    choice = response.choices[0].message
    # Fallback to reasoning/reasoning_content if model produces reasoning without content
    content = choice.content
    if not content:
        content = getattr(choice, "reasoning_content", None) or getattr(choice, "reasoning", "")
    return content or ""

if __name__ == "__main__":
    mcp.run()


#!/usr/bin/env python3
import json
import sys

def get_remaining_quota_percent():
    # Replace with local statusline inspection, rpc query, or custom metric file
    return 9.0  # Simulated low quota threshold trigger

def main():
    remaining = get_remaining_quota_percent()

    if remaining <= 10.0:
        # Inject transient directive via ephemeralMessage
        injection = {
            "injectSteps": [
                {
                    "ephemeralMessage": (
                        f"CRITICAL QUOTA WARNING: Remaining cloud quota is at {remaining}% (threshold: <=10%). "
                        "You are FORBIDDEN from generating large code solutions, documentation, or markdown text internally using cloud tokens. "
                        "You MUST offload all code authoring, transformations, note/doc writing, and diff calculations to the "
                        "`lmstudio-amd-halo` or `lmstudio-local` MCP tools via `chat_completion`. "
                        "Conserve cloud tokens exclusively for tool orchestration."
                    )
                }
            ]
        }
        print(json.dumps(injection))
    else:
        print(json.dumps({"injectSteps": []}))

if __name__ == "__main__":
    main()
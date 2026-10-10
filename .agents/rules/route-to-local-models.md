---
trigger: always_on
description: "Always route code authoring, refactoring, and documentation writing to local LM Studio instances."
---

# Local Model Delegation Rule (Code & Documentation)

When generating, modifying, or refactoring code, specifications, or documentation:
1. Do NOT author substantial code or long documentation/notes directly using cloud model tokens.
2. Delegate the generation to the local model via the `lmstudio-local` MCP tool (which routes directly to the active model, currently `google/gemma-4-12b-qat`) or `lmstudio-amd-halo`.
3. Provide the full prompt, relevant context, files, and constraints to the MCP `chat_completion` tool.
4. Take the returned content (code or documentation) from the local model and apply it to workspace or vault files using `replace_file_content` or `write_to_file`.

#!/bin/bash
# sync-agents-md.sh — PostToolUse hook
# When CLAUDE.md is modified, prompts Claude to sync AGENTS.md.

set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Only trigger for root CLAUDE.md (not .claude/ subdirectory files)
if [[ "$(basename "$FILE_PATH")" != "CLAUDE.md" ]] || [[ "$FILE_PATH" == *".claude/"* ]]; then
  exit 0
fi

cat <<'EOF'
{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"⚠️ HOOK: CLAUDE.md was just modified. You MUST now read AGENTS.md and update it to stay in sync with CLAUDE.md. Preserve AGENTS.md-specific differences: (1) header '# AGENTS.md', (2) description mentions 'OpenAI Codex' instead of 'Claude Code', (3) no 'Codex CLI' section. Apply all other changes from CLAUDE.md to AGENTS.md."}}
EOF

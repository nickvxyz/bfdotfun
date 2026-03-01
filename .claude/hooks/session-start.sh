#!/bin/bash
# SessionStart hook — loads context at the start of every session
# Outputs git status and last session memory as additional context

set -euo pipefail

PROJECT_DIR="/home/claude/projects/burnfatdotfun"
MEMORY_FILE="$PROJECT_DIR/.claude/memory.md"

cd "$PROJECT_DIR"

# Git status
GIT_STATUS=$(git status --short 2>/dev/null || echo "not a git repo")
GIT_LOG=$(git log --oneline -5 2>/dev/null || echo "no commits")

# Last session memory
MEMORY=""
if [ -f "$MEMORY_FILE" ]; then
  MEMORY=$(tail -30 "$MEMORY_FILE")
fi

# Output as JSON for Claude to receive as additional context
python3 -c "
import json, sys

context = '''## Session Context (auto-loaded)

### Recent git commits
$GIT_LOG

### Working tree status
$GIT_STATUS

### Last session notes
$MEMORY
'''

print(json.dumps({
  'continue': True,
  'hookSpecificOutput': {
    'hookEventName': 'SessionStart',
    'additionalContext': context.strip()
  }
}))
"

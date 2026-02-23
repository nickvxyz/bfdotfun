#!/bin/bash
# Stop hook — writes session summary to memory file after Claude finishes
# Keeps a running log of what was done across sessions

set -euo pipefail

PROJECT_DIR="/home/openclaw/projects/burnfatdotfun"
MEMORY_FILE="$PROJECT_DIR/.claude/memory.md"
DATE=$(date '+%Y-%m-%d %H:%M')

cd "$PROJECT_DIR"

# Get what changed this session
GIT_DIFF=$(git log --oneline -3 2>/dev/null || echo "no recent commits")
CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD 2>/dev/null | head -10 || echo "")

# Only write if something actually changed
if [ -z "$CHANGED_FILES" ]; then
  exit 0
fi

# Append to memory file
cat >> "$MEMORY_FILE" << EOF

## $DATE
**Recent commits:**
$GIT_DIFF

**Files changed:**
$CHANGED_FILES

---
EOF

exit 0

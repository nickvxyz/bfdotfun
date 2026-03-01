#!/bin/bash
# Stop hook — writes session summary to memory file after Claude finishes
# Deduplicates: skips write if latest commit is already in memory

set -euo pipefail

PROJECT_DIR="/home/claude/projects/burnfatdotfun"
MEMORY_FILE="$PROJECT_DIR/.claude/memory.md"
DATE=$(date '+%Y-%m-%d')

cd "$PROJECT_DIR"

# Get latest commit hash
LATEST_HASH=$(git log --oneline -1 --format="%h" 2>/dev/null || echo "")
if [ -z "$LATEST_HASH" ]; then
  exit 0
fi

# Skip if this commit is already recorded in memory
if [ -f "$MEMORY_FILE" ] && grep -qF "$LATEST_HASH" "$MEMORY_FILE"; then
  exit 0
fi

# Get what changed this session
GIT_LOG=$(git log --oneline -3 2>/dev/null || echo "no recent commits")
CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD 2>/dev/null | head -10 || echo "")

# Only write if something actually changed
if [ -z "$CHANGED_FILES" ]; then
  exit 0
fi

# Append to memory file
cat >> "$MEMORY_FILE" << EOF

## $DATE
**Recent commits:**
$GIT_LOG

**Files changed:**
$CHANGED_FILES

---
EOF

# Keep memory file trimmed — only last 20 entries
if [ -f "$MEMORY_FILE" ]; then
  ENTRY_COUNT=$(grep -c "^## " "$MEMORY_FILE" || echo "0")
  if [ "$ENTRY_COUNT" -gt 20 ]; then
    # Keep header + last 20 entries (split on "## " lines)
    python3 -c "
import re
with open('$MEMORY_FILE') as f:
    content = f.read()
entries = re.split(r'(?=^## )', content, flags=re.MULTILINE)
entries = [e for e in entries if e.strip()]
trimmed = ''.join(entries[-20:])
with open('$MEMORY_FILE', 'w') as f:
    f.write(trimmed)
"
  fi
fi

exit 0

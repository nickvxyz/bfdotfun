#!/bin/bash
# PreCompact hook — saves key context before auto-compaction compresses history
# Runs when context hits ~95% full
# Appends a snapshot to memory.md so nothing important is lost

set -euo pipefail

PROJECT_DIR="/home/openclaw/projects/burnfatdotfun"
MEMORY_FILE="$PROJECT_DIR/.claude/memory.md"
DATE=$(date '+%Y-%m-%d %H:%M')

cd "$PROJECT_DIR"

# Capture current state before compaction
GIT_LOG=$(git log --oneline -5 2>/dev/null || echo "no commits")
CHANGED=$(git diff --name-only 2>/dev/null | head -10 || echo "")
STAGED=$(git diff --cached --name-only 2>/dev/null | head -10 || echo "")

cat >> "$MEMORY_FILE" << EOF

## $DATE — [PRE-COMPACT SNAPSHOT]
Context window reached capacity. State at compaction:

**Recent commits:**
$GIT_LOG

**Uncommitted changes:**
${CHANGED:-none}

**Staged:**
${STAGED:-none}

---
EOF

exit 0

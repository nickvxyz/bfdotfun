#!/bin/bash
# PostToolUse hook — runs after every Edit/Write/MultiEdit
# Checks TypeScript and ESLint on changed file
# Exit 0 = pass, exit 2 = block Claude and show error

set -euo pipefail

INPUT=$(cat)
FILE=$(echo "$INPUT" | python3 -c "import sys,json; d=json.loads(sys.stdin.read()); print(d.get('tool_input',{}).get('file_path',''))" 2>/dev/null || echo "")

# Only check TypeScript/JS files
if [[ "$FILE" != *.tsx ]] && [[ "$FILE" != *.ts ]] && [[ "$FILE" != *.jsx ]] && [[ "$FILE" != *.js ]]; then
  exit 0
fi

PROJECT_DIR="/home/claude/projects/burnfatdotfun"

cd "$PROJECT_DIR"

# Run TypeScript check (fast, no emit)
TSC_OUT=$(npx tsc --noEmit 2>&1 || true)
if echo "$TSC_OUT" | grep -q "error TS"; then
  echo "TypeScript errors found after editing $FILE:" >&2
  echo "$TSC_OUT" | grep "error TS" | head -10 >&2
  exit 2
fi

# Run ESLint on the changed file only
LINT_OUT=$(npx eslint "$FILE" --format compact 2>&1 || true)
if echo "$LINT_OUT" | grep -q "error"; then
  echo "ESLint errors in $FILE:" >&2
  echo "$LINT_OUT" >&2
  exit 2
fi

exit 0

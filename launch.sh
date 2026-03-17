#!/bin/bash
# BurnFat.fun — Overnight Agent Launcher
# Each agent runs in an isolated git worktree — no conflicts
#
# Usage:
#   ./launch.sh all           — preflight + launch all active agents
#   ./launch.sh contracts     — contract-evm only
#   ./launch.sh frontend      — ux + backend only
#   ./launch.sh review        — reviewer only
#   ./launch.sh status        — show all agent status
#   ./launch.sh preflight     — run all checks without launching
#   ./launch.sh kill [name]   — kill agent session (or all)
#   ./launch.sh cleanup       — remove exp/* branches older than 7 days

set -euo pipefail

REPO="/home/claude/projects/burnfatdotfun"
AGENTS="$REPO/.claude/agents"
WT_BASE="/home/claude/worktrees"
DATE=$(date +%Y-%m-%d)
PREFLIGHT_PASSED=false

# Required env vars — launch aborts if any missing
REQUIRED_VARS=(
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
  NEXT_PUBLIC_CHAIN_ID
  NEXT_PUBLIC_BURNFAT_CONTRACT_ADDRESS
)

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_ok()   { echo -e "  ${GREEN}✓${NC} $1"; }
log_fail() { echo -e "  ${RED}✗${NC} $1"; }
log_warn() { echo -e "  ${YELLOW}⚠${NC} $1"; }

# ─────────────────────────────────────────────
# PREFLIGHT CHECKS
# ─────────────────────────────────────────────
preflight() {
  echo ""
  echo "═══════════════════════════════════════"
  echo " PREFLIGHT CHECKS"
  echo "═══════════════════════════════════════"
  local failed=0

  # 1. Repo exists
  if [ ! -d "$REPO" ]; then
    log_fail "Repo not found at $REPO"
    exit 1
  fi
  log_ok "Repo exists"

  cd "$REPO"

  # 2. On main branch and clean
  local branch=$(git branch --show-current 2>/dev/null)
  if [ "$branch" != "main" ]; then
    log_warn "Not on main (on $branch) — agents will branch from current HEAD"
  else
    log_ok "On main branch"
  fi

  # 3. No active git conflicts
  if git diff --name-only --diff-filter=U 2>/dev/null | grep -q .; then
    log_fail "Git merge conflicts detected"
    git diff --name-only --diff-filter=U
    failed=1
  else
    log_ok "No git conflicts"
  fi

  # 4. No stale worktrees
  local stale=$(git worktree list --porcelain 2>/dev/null | grep -c "^worktree " || echo 1)
  if [ "$stale" -gt 1 ]; then
    log_warn "Stale worktrees found — cleaning"
    for wt in "$WT_BASE"/*/; do
      [ -d "$wt" ] && git worktree remove --force "$wt" 2>/dev/null
    done
    git worktree prune 2>/dev/null
  fi
  log_ok "Worktrees clean"

  # 5. Required env vars
  if [ -f "$REPO/.env.local" ]; then
    local missing_vars=()
    for var in "${REQUIRED_VARS[@]}"; do
      val=$(grep "^${var}=" "$REPO/.env.local" 2>/dev/null | cut -d= -f2-)
      if [ -z "$val" ] || [ "$val" = "your-walletconnect-project-id" ]; then
        missing_vars+=("$var")
      fi
    done
    if [ ${#missing_vars[@]} -gt 0 ]; then
      log_warn "Missing/placeholder env vars: ${missing_vars[*]}"
    else
      log_ok "All required env vars present"
    fi
  else
    log_fail ".env.local not found"
    failed=1
  fi

  # 6. Build check
  echo "  Building..."
  if npm run build --silent > /tmp/preflight-build.log 2>&1; then
    log_ok "npm run build passes"
  else
    log_fail "npm run build FAILED"
    tail -20 /tmp/preflight-build.log
    failed=1
  fi

  # 7. No conflicting tmux sessions
  local running
  running=$(tmux ls 2>/dev/null | grep -cE "^(ux|backend|reviewer|contract-evm|qa|explorer):" || true)
  running=${running:-0}
  if [ "$running" -gt 0 ]; then
    log_warn "$running agent session(s) already running — will be killed on launch"
  else
    log_ok "No conflicting agent sessions"
  fi

  echo ""
  if [ "$failed" -eq 0 ]; then
    echo -e "  ${GREEN}PREFLIGHT PASSED${NC}"
    PREFLIGHT_PASSED=true
  else
    echo -e "  ${RED}PREFLIGHT FAILED — fix issues before launching${NC}"
    PREFLIGHT_PASSED=false
  fi
  echo "═══════════════════════════════════════"
  echo ""
}

# ─────────────────────────────────────────────
# WORKTREE SETUP
# ─────────────────────────────────────────────
setup_worktree() {
  local name=$1
  local branch="exp/${name}-${DATE}"
  local wt_dir="$WT_BASE/$name"

  # Clean existing
  if [ -d "$wt_dir" ]; then
    git -C "$REPO" worktree remove --force "$wt_dir" 2>/dev/null || true
  fi
  git -C "$REPO" branch -D "$branch" 2>/dev/null || true
  git -C "$REPO" worktree prune 2>/dev/null

  # Create fresh worktree
  mkdir -p "$WT_BASE"
  git -C "$REPO" worktree add "$wt_dir" -b "$branch" main >/dev/null 2>&1

  # Symlink shared resources
  ln -sf "$REPO/node_modules" "$wt_dir/node_modules"
  ln -sf "$REPO/.env.local" "$wt_dir/.env.local"

  echo "$wt_dir"
}

# ─────────────────────────────────────────────
# AGENT LAUNCHER
# ─────────────────────────────────────────────
launch_agent() {
  local name=$1
  local agent_file=$2
  local task=$3

  # Kill existing session
  tmux kill-session -t "$name" 2>/dev/null || true

  # Setup isolated worktree
  local wt_dir
  wt_dir=$(setup_worktree "$name")
  local findings="$wt_dir/FINDINGS-${name}.md"

  # Write prompt to file (avoids quoting issues)
  cat > "$wt_dir/agent-prompt.txt" << PROMPT
Read $agent_file first. Then read CLAUDE.md for project context.

IMPORTANT RULES:
- Write all findings to FINDINGS-${name}.md in your working directory (NOT the main FINDINGS.md)
- Do NOT run database migrations — document needed migrations in FINDINGS-${name}.md
- Do NOT push to main — commit to your branch only
- Do NOT ingest to RAG (forge.sqlite) — only forge does that
- Run npm run build before committing — fix any errors

$task

When done, append a summary to FINDINGS-${name}.md with:
- What you changed
- Files modified
- Any blockers or issues for Nick
- Build status (pass/fail)
PROMPT

  echo "  Launching: $name"
  echo "  Worktree:  $wt_dir"
  echo "  Branch:    exp/${name}-${DATE}"
  echo "  Findings:  $findings"

  # Launch in tmux with full bypass, print mode, max 200 turns
  tmux new-session -d -s "$name" \
    "cd $wt_dir && \
     env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT -u CLAUDE_CODE_SESSION_ACCESS_TOKEN \
     claude --dangerously-skip-permissions -p --max-turns 200 \
     \"\$(cat $wt_dir/agent-prompt.txt)\" \
     > $wt_dir/agent-output.log 2>&1; \
     echo '${name} DONE at \$(date)' >> $wt_dir/agent-output.log"

  echo "  Log:       $wt_dir/agent-output.log"
  echo ""
}

# ─────────────────────────────────────────────
# STATUS
# ─────────────────────────────────────────────
show_status() {
  echo ""
  echo "═══════════════════════════════════════"
  echo " BurnFat.fun Agent Status — $(date)"
  echo "═══════════════════════════════════════"
  echo ""

  echo "Worktrees:"
  git -C "$REPO" worktree list
  echo ""

  echo "Tmux sessions:"
  tmux ls 2>/dev/null || echo "  None running"
  echo ""

  echo "Agent outputs:"
  for wt in "$WT_BASE"/*/; do
    [ ! -d "$wt" ] && continue
    local name=$(basename "$wt")
    if [ -f "$wt/agent-output.log" ]; then
      local lines=$(wc -l < "$wt/agent-output.log")
      local last=$(tail -1 "$wt/agent-output.log" 2>/dev/null | head -c 100)
      echo "  $name: $lines lines | last: $last"
    else
      echo "  $name: no output yet"
    fi
    if [ -f "$wt/FINDINGS-${name}.md" ]; then
      echo "    FINDINGS: $(wc -l < "$wt/FINDINGS-${name}.md") lines"
    fi
  done
  echo ""

  echo "Process check:"
  for s in $(tmux ls -F '#{session_name}' 2>/dev/null | grep -v main); do
    local pid=$(tmux list-panes -t "$s" -F '#{pane_pid}' 2>/dev/null)
    if [ -n "$pid" ]; then
      local children=$(pstree -p "$pid" 2>/dev/null | grep -c claude || echo 0)
      if [ "$children" -gt 0 ]; then
        echo "  $s: claude running (PID tree from $pid)"
      else
        echo "  $s: session alive, no claude process"
      fi
    fi
  done
  echo ""

  echo "Experiment branches:"
  cd "$REPO" && git branch | grep -E "exp/" | while read b; do
    echo "  $b"
  done
  echo ""
  echo "═══════════════════════════════════════"
}

# ─────────────────────────────────────────────
# KILL
# ─────────────────────────────────────────────
kill_agents() {
  local target=${1:-all}
  if [ "$target" = "all" ]; then
    for s in $(tmux ls -F '#{session_name}' 2>/dev/null | grep -v main); do
      tmux kill-session -t "$s" 2>/dev/null
      echo "  Killed: $s"
    done
  else
    tmux kill-session -t "$target" 2>/dev/null && echo "  Killed: $target"
  fi
}

# ─────────────────────────────────────────────
# CLEANUP — delete exp/* branches older than 7 days
# ─────────────────────────────────────────────
cleanup_branches() {
  echo "Cleaning up old experiment branches..."
  cd "$REPO"
  local cutoff=$(date -d "7 days ago" +%Y-%m-%d 2>/dev/null || date -v-7d +%Y-%m-%d 2>/dev/null)
  local count=0

  for branch in $(git branch | grep "exp/" | tr -d ' *+'); do
    # Extract date from branch name (exp/agent-YYYY-MM-DD)
    local bdate=$(echo "$branch" | grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2}$')
    if [ -n "$bdate" ] && [[ "$bdate" < "$cutoff" ]]; then
      # Check if fully merged
      if git branch --merged main | grep -q "$branch"; then
        git branch -d "$branch" 2>/dev/null && echo "  Deleted (merged): $branch" && count=$((count+1))
      else
        echo "  Skipped (unmerged): $branch"
      fi
    fi
  done

  # Also clean worktrees
  git worktree prune 2>/dev/null
  echo "  Cleaned $count branches"
}

# ─────────────────────────────────────────────
# MERGE FINDINGS — forge calls this after overnight run
# ─────────────────────────────────────────────
merge_findings() {
  echo "Merging agent findings..."
  local merged="$REPO/FINDINGS.md"

  echo "" >> "$merged"
  echo "---" >> "$merged"
  echo "## Overnight Run — $(date)" >> "$merged"
  echo "" >> "$merged"

  for wt in "$WT_BASE"/*/; do
    [ ! -d "$wt" ] && continue
    local name=$(basename "$wt")
    if [ -f "$wt/FINDINGS-${name}.md" ]; then
      echo "### $name" >> "$merged"
      cat "$wt/FINDINGS-${name}.md" >> "$merged"
      echo "" >> "$merged"
    fi
  done

  echo "  Merged to $merged"
}

# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────
MODE=${1:-}

case $MODE in

  preflight)
    preflight
    ;;

  status)
    show_status
    ;;

  kill)
    kill_agents "${2:-all}"
    ;;

  cleanup)
    cleanup_branches
    ;;

  merge-findings)
    merge_findings
    ;;

  contracts)
    preflight
    [ "$PREFLIGHT_PASSED" != "true" ] && exit 1
    echo "Launching contract agent..."
    launch_agent "contract-evm" ".claude/agents/contract-evm.md" \
      "Deploy BurnFatTreasury to Base Sepolia. Follow your agent instructions exactly."
    ;;

  frontend)
    preflight
    [ "$PREFLIGHT_PASSED" != "true" ] && exit 1
    echo "Launching frontend agents..."
    launch_agent "ux" ".claude/agents/ux.md" \
      "Run your full UX checklist. Fix everything in scope."
    sleep 2
    launch_agent "backend" ".claude/agents/backend.md" \
      "Audit all API routes for createAdminClient() compliance. Fix .single() vs .maybeSingle() issues."
    ;;

  review)
    preflight
    [ "$PREFLIGHT_PASSED" != "true" ] && exit 1
    echo "Launching reviewer..."
    launch_agent "reviewer" ".claude/agents/reviewer.md" \
      "Review all files changed on experiment branches. Produce structured report."
    ;;

  all)
    preflight
    [ "$PREFLIGHT_PASSED" != "true" ] && exit 1

    echo ""
    echo "═══════════════════════════════════════"
    echo " OVERNIGHT LAUNCH — $DATE"
    echo "═══════════════════════════════════════"
    echo ""

    launch_agent "contract-evm" ".claude/agents/contract-evm.md" \
      "PRIORITY: Deploy BurnFatTreasury to Base Sepolia. Address is 0x000...000 blocking all submissions."
    sleep 2

    launch_agent "backend" ".claude/agents/backend.md" \
      "Audit all API routes. Fix createAdminClient() compliance and .single() vs .maybeSingle() issues."
    sleep 2

    launch_agent "ux" ".claude/agents/ux.md" \
      "Run full UX checklist. Fix all items in scope. Flag anything requiring API changes."
    sleep 2

    launch_agent "reviewer" ".claude/agents/reviewer.md" \
      "Review all recently changed files. Produce structured report."
    sleep 2

    launch_agent "qa" ".claude/agents/qa.md" \
      "Write tests for untested API routes. Start with critical issues."

    echo "═══════════════════════════════════════"
    echo " All agents launched"
    echo ""
    echo " Monitor:  ./launch.sh status"
    echo " Kill:     ./launch.sh kill [name|all]"
    echo " Merge:    ./launch.sh merge-findings"
    echo "═══════════════════════════════════════"
    ;;

  *)
    echo "Usage: ./launch.sh [all|contracts|frontend|review|status|preflight|kill|cleanup|merge-findings]"
    exit 1
    ;;

esac

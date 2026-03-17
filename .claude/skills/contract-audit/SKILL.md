---
name: contract-audit
description: Run 3 mandatory Codex security checks before any contract deployment. Codex runs in /tmp/codex-audit/ isolation — never in project root.
user-invocable: false
---

# Skill: contract-audit
# Invoked by: contract-evm agent
# Purpose: Run 3 mandatory Codex security checks before any contract deployment
# Isolation: Codex ALWAYS runs in /tmp/codex-audit/ — never in project root

## Rules — non-negotiable
- NEVER invoke Codex from inside the project directory
- ALWAYS copy contract to /tmp/codex-audit/ first
- ALWAYS use --approval-mode suggest — Codex never edits files
- All 3 checks must pass before deployment is allowed
- If any check fails — stop, fix contract, run all 3 again from scratch

## Setup (run once per session)
```bash
mkdir -p /tmp/codex-audit
rm -f /tmp/codex-audit/*.sol
rm -f /tmp/codex-audit/report-*.md
```

## Step 1 — Copy contract to isolated directory
```bash
# Replace CONTRACT with actual filename e.g. BurnFatTreasury.sol
cp /home/claude/projects/burnfatdotfun/contracts/[CONTRACT] /tmp/codex-audit/
cd /tmp/codex-audit
```

## Step 2 — CHECK 1: DETECT
Find all vulnerabilities. Codex audits the contract and outputs findings.
```bash
codex --approval-mode suggest \
  "Audit this Solidity smart contract for security vulnerabilities.
   List every issue you find with: severity (CRITICAL/HIGH/MEDIUM/LOW),
   location (line number), description, and recommended fix.
   Output as structured markdown." \
  > /tmp/codex-audit/report-detect.md 2>&1

echo "=== DETECT COMPLETE ==="
cat /tmp/codex-audit/report-detect.md
```

Pass condition: zero CRITICAL or HIGH vulnerabilities found.
If CRITICAL or HIGH found → stop, report to contract-evm to fix, do not proceed.

## Step 3 — CHECK 2: PATCH
Verify the contract can be fixed without breaking functionality.
```bash
codex --approval-mode suggest \
  "Review this Solidity contract. For each vulnerability identified,
   propose the exact code change needed to fix it.
   Show before/after for each fix.
   Confirm each fix preserves the original contract functionality.
   Do NOT apply any changes — suggest only." \
  > /tmp/codex-audit/report-patch.md 2>&1

echo "=== PATCH COMPLETE ==="
cat /tmp/codex-audit/report-patch.md
```

Pass condition: all proposed patches preserve functionality (no breaking changes).

## Step 4 — CHECK 3: EXPLOIT
Attempt to find exploitable attack vectors.
```bash
codex --approval-mode suggest \
  "Analyze this Solidity smart contract as a security researcher.
   Attempt to identify any exploit path that could:
   - Drain funds from the contract
   - Allow unauthorized access
   - Cause reentrancy attacks
   - Manipulate state unexpectedly
   Describe each exploit path with exact steps.
   Do NOT execute anything — analysis only." \
  > /tmp/codex-audit/report-exploit.md 2>&1

echo "=== EXPLOIT COMPLETE ==="
cat /tmp/codex-audit/report-exploit.md
```

Pass condition: no exploitable paths found.

## Step 5 — Compile audit summary
```bash
cat > /tmp/codex-audit/report-summary.md << EOF
# Codex Audit Summary — [CONTRACT] — $(date)

## Check 1: DETECT
$(grep -E "CRITICAL|HIGH|MEDIUM|LOW|✅|❌|Pass|Fail" /tmp/codex-audit/report-detect.md | head -20)

## Check 2: PATCH
$(grep -E "fix|patch|change|preserve|breaking" /tmp/codex-audit/report-patch.md | head -20)

## Check 3: EXPLOIT
$(grep -E "exploit|drain|attack|vulnerable|safe" /tmp/codex-audit/report-exploit.md | head -20)

## Verdict
[ ] PASS — all 3 checks clean, safe to deploy
[ ] FAIL — issues found, deployment blocked
EOF

cat /tmp/codex-audit/report-summary.md
```

## Step 6 — Report to contract-evm
Append full summary to project FINDINGS.md:
```bash
echo "" >> /home/claude/projects/burnfatdotfun/FINDINGS.md
echo "---" >> /home/claude/projects/burnfatdotfun/FINDINGS.md
cat /tmp/codex-audit/report-summary.md >> /home/claude/projects/burnfatdotfun/FINDINGS.md
```

## Step 7 — Cleanup
```bash
rm -rf /tmp/codex-audit/
```

## Timeout / empty output handling — non-negotiable
If codex exits with a non-zero code, times out, or produces an empty report:
- Treat as FAIL — never as pass
- Log the error to report-summary.md
- Do NOT proceed to deployment
- Report the failure to contract-evm for investigation

## Deployment gate
contract-evm MUST NOT deploy unless:
- report-detect.md contains zero CRITICAL or HIGH issues AND is non-empty
- report-patch.md confirms all fixes preserve functionality AND is non-empty
- report-exploit.md contains no exploitable paths AND is non-empty
- All three reports were generated without errors or timeouts

If any check fails → contract-evm fixes the contract → entire skill runs again from Step 1.

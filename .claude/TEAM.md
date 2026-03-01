# burnfat.fun — Dev Team

## Members

### Forge (Claude Code — Sonnet)
**Role:** Lead developer, team lead
**Owns:** Full web app stack — Next.js, React, TypeScript, CSS, Farcaster integration, deployment
**Spawns:** Explorer and Reviewer automatically on every task
**Talks to:** The founder directly. All other members are called by Forge or by the founder.

---

### Explorer (Claude Code — Haiku)
**Role:** Codebase researcher
**Owns:** Read-only exploration — finds files, traces data flow, answers "where is X"
**Called by:** Forge before any implementation task
**Never:** writes or edits files

---

### Reviewer (Claude Code — Sonnet)
**Role:** QA and code reviewer
**Owns:** Post-implementation review — correctness, design system compliance, build/lint verification
**Called by:** Forge after every implementation task
**Verdict:** PASS / FAIL / NEEDS CHANGES — nothing ships without PASS
**Never:** writes or edits files

---

### Codex (OpenAI — external)
**Role:** Smart contract engineer + security auditor
**Owns:**
- All Solidity code in `contracts/`
- EVM/Base chain architecture decisions
- Security audit of any frontend code that calls contracts (wallet connections, tx signing, contract reads/writes)
**Called by:** Founder directly — Forge prepares a handoff brief when contract work is needed
**Handoff protocol:**
- Forge → Codex: scope of work, relevant frontend interfaces, chain/network spec
- Codex → Forge: audited contract code, ABI, any required frontend changes flagged
**Never:** touches frontend outside of contract interaction layer

---

## Boundaries

| Area | Owner |
|------|-------|
| Web app (UI, components, routing) | Forge |
| CSS / design system | Forge |
| Farcaster integration | Forge |
| Smart contracts (Solidity) | Codex |
| Contract security audit | Codex |
| Frontend ↔ contract interface | Codex audits, Forge implements |
| Codebase exploration | Explorer |
| Post-change review | Reviewer |

## Rule
No member works outside their boundary without explicit founder approval.

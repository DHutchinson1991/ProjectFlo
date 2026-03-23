# ProjectFlo — Agent Error Ledger

Track systemic mistakes (Pattern category only). One-off typos/blunders are NOT logged here.
After a pattern appears ≥2 times or is high-impact, update the relevant `.github/instructions/*.instructions.md` file.

## Entry format
```
## [YYYY-MM-DD] Short description
- **Trigger**: What caused the mistake
- **Category**: Pattern | Context
- **Resolution**: How it was fixed
- **Instruction updated**: <file> or "none"
- **Status**: Open | Resolved
```

---

<!-- Add new entries below this line -->

## [2026-03-23] Asked user about Render despite deployment instructions documenting it
- **Trigger**: Before squashing migrations, asked "do you have any external hosted DB environments?" — deployment.instructions.md explicitly documents Render as the backend platform and database host.
- **Category**: Pattern
- **Resolution**: Always read `deployment.instructions.md` before asking any question about environments, infrastructure, or hosting.
- **Instruction updated**: deployment.instructions.md, copilot-instructions.md
- **Status**: Resolved

## [2026-03-23] Did not automatically update render.yaml when squashing migrations
- **Trigger**: Squashed migrations but suggested the user manually run `prisma migrate resolve` via the Render Shell instead of embedding it in the deploy command.
- **Category**: Pattern
- **Resolution**: When squashing migrations, always update `render.yaml` buildCommand with `prisma migrate resolve --applied 0_baseline || true` before `prisma migrate deploy`.
- **Instruction updated**: migrations.instructions.md
- **Status**: Resolved

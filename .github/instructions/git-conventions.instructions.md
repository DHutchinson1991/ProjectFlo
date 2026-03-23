---
description: "Use when creating branches, writing commit messages, opening pull requests, or reviewing code changes."
---

# ProjectFlo — Git & PR Conventions

## Branch naming

Format: `<type>/<short-description>`

| Type | When |
|------|------|
| `feature/` | New functionality |
| `fix/` | Bug fixes |
| `refactor/` | Code restructuring (no behaviour change) |
| `chore/` | Dependencies, config, CI, docs |

Examples: `feature/equipment-availability`, `fix/estimate-total-rounding`, `refactor/split-inquiry-service`.

- Use lowercase kebab-case after the prefix.
- Keep descriptions under 5 words.

## Commit messages

Format: `<type>: <description>`

Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`.

```
feat: add equipment availability subtask
fix: correct estimate total rounding
refactor: split inquiry service into sub-services
chore: update prisma to 6.x
docs: add payment-brackets README
test: add quotes service specs
```

- Use imperative mood ("add", not "added" or "adds").
- No period at the end.
- Keep the first line under 72 characters.
- Add a blank line + body for complex changes.

## Pull requests

### Title

Same format as commit messages: `<type>: <description>`.

### Description template

```markdown
## What changed
Brief summary of the change.

## Why
Context / ticket / problem being solved.

## Testing
How this was tested (manual steps, new specs, etc.).

## Checklist
- [ ] `pnpm build` passes
- [ ] `pnpm test` passes
- [ ] `pnpm lint` passes
- [ ] README / reference docs updated (if business rules changed)
- [ ] Migration committed (if schema changed)
```

## Rules

- Do not force-push to `master` or `develop`.
- Squash-merge feature branches into `develop`.
- Keep PRs focused — one logical change per PR.
- If a PR touches pricing logic, update `PRICING_TOTALS_REFERENCE.md`.

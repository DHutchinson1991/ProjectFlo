---
description: "Stage, commit, and push current changes to the develop branch with a conventional commit message."
---

# Commit to Develop

Stage all current changes, generate a conventional commit message, and push to the `develop` branch.

## Process

### 1. Review changes

1. Run `git status` to see all modified, added, and deleted files.
2. Run `git diff --stat` to get a summary of changes by file.
3. For each changed file, understand what was modified (read the diff or the file if needed).

### 2. Classify the change

Determine the commit type based on what changed:

| Type | When |
|------|------|
| `feat` | New functionality added |
| `fix` | Bug fix |
| `refactor` | Code restructuring, no behaviour change |
| `chore` | Dependencies, config, CI, docs-only |
| `docs` | Documentation only |
| `test` | Adding or updating tests |
| `style` | Formatting, whitespace, missing semicolons |

If the changeset spans multiple types, use the **primary** type (the one that describes the most impactful change).

### 3. Write the commit message

Format: `<type>: <description>`

Rules:
- Imperative mood: "add", not "added" or "adds"
- No period at the end
- Under 72 characters
- Lowercase after the type prefix

For complex changes, add a body after a blank line:
```
feat: add equipment availability checking

- Added availability query to equipment service
- Updated crew slot assignment to check conflicts
- Added validation in package schedule card
```

### 4. Stage and commit

```bash
git add -A && git commit -m "<type>: <description>"
```

If a body is needed:
```bash
git add -A && git commit -m "<type>: <description>" -m "<body>"
```

### 5. Push

```bash
git push origin develop
```

If the branch is not `develop`, switch first:
```bash
git checkout develop && git merge --no-ff <current-branch> && git push origin develop
```

## Rules

- **Never force-push** to `develop`.
- **Never amend** a commit that has already been pushed.
- **One logical change per commit** — if the changeset has unrelated changes, ask the user whether to split into multiple commits.
- **Check for sensitive data** — never commit `.env` files, tokens, or secrets. Verify `.gitignore` covers them.
- **Max 2 terminal commands** for the entire flow (stage+commit as one, push as two). Combine with `&&`.

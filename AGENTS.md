## ProjectFlo agents

This repository uses Cursor AI Rules in `.cursor/rules/*.mdc` as the canonical persistent instruction set.

### Global rules (always on)

- `.cursor/rules/core-projectflo.mdc`

### Agent roles

#### Backend agent

Use when working under `packages/backend/`.

- **Architecture & modules**: `.cursor/rules/backend-architecture.mdc`
- **API routes/controllers**: `.cursor/rules/api-design.mdc`
- **Validation**: `.cursor/rules/validation.mdc`
- **Errors**: `.cursor/rules/error-handling.mdc`
- **Logging**: `.cursor/rules/logging.mdc`
- **DB design**: `.cursor/rules/database-design.mdc`
- **Migrations & scripts**: `.cursor/rules/migrations-and-scripts.mdc`
- **Seeds**: `.cursor/rules/seed-data.mdc`
- **New models workflow**: `.cursor/rules/new-prisma-model.mdc`

#### Frontend agent

Use when working under `packages/frontend/`.

- **Architecture & placement**: `.cursor/rules/frontend-architecture.mdc`
- **API/client conventions**: `.cursor/rules/frontend-conventions.mdc`
- **Design system**: `.cursor/rules/frontend-design-system.mdc`
- **React Query**: `.cursor/rules/react-query.mdc`
- **Brand scoping**: `.cursor/rules/brand-scoping.mdc`
- **Errors**: `.cursor/rules/error-handling.mdc`
- **Logging**: `.cursor/rules/logging.mdc`

#### Refactor / migration agent

Use when moving files, renaming modules, changing contracts, or deleting legacy code.

- **Safety gates**: `.cursor/rules/refactoring-safety.mdc`
- **Migration playbook**: `.cursor/rules/feature-refactor-playbook.mdc`
- **Feature docs**: `.cursor/rules/feature-readmes.mdc`
- **Git/PR conventions**: `.cursor/rules/git-and-prs.mdc`

#### Release / infra agent

Use when dealing with environments, CI/CD, or hosting changes.

- **Deployment**: `.cursor/rules/deployment.mdc`
- **Commands/terminal discipline**: `.cursor/rules/commands-and-terminal-discipline.mdc`


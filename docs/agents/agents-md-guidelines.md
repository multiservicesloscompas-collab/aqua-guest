# AGENTS.md Guidelines

This document outlines the standard rules and conventions for creating, updating, and maintaining `AGENTS.md` files within the AquaGest monorepo.

## What is AGENTS.md?

Following the [agents.md specification](https://agents.md/), an `AGENTS.md` file acts as a "README for AI agents". While a `README.md` is intended for human developers (context, setup, features), the `AGENTS.md` file provides **predictable, machine-actionable instructions** for AI coding assistants.

**If you are an LLM asked to create or update an AGENTS.md, you MUST follow these rules exactly.**

---

## 🚦 Core Rules

### 1. File Naming and Location
- The file MUST be named exactly `AGENTS.md`.
- It should be located at the root of the project or sub-workspace (e.g., `apps/web-app/AGENTS.md`).
- Do not use names like `AGENT.md`, `rules.md`, or `.cursorrules` unless required by specific tooling.

### 2. Conciseness and Tone
- Write in clear, concise imperative statements.
- DO NOT use conversational text or filler words.
- Use lists for instructions rather than paragraphs whenever possible.
- Focus purely on actionable guidance.

### 3. Separation of Concerns
- **DO NOT put human-focused documentation in `AGENTS.md`.** Project descriptions, marketing copy, or detailed feature explanations belong in `README.md`.
- Put exact terminal commands, test paths, linting instructions, and coding standards in `AGENTS.md`.

---

## 🏗️ Required Structure

When creating a new `AGENTS.md` or auditing an existing one, ensure it contains the following sections as applicable to the app:

### `## Dev environment tips`
List the exact commands required for the AI to interact with the codebase.
- Exact build commands (e.g., `npx nx build web-app`).
- Exact commands to clear cache or jump to packages.
- Path aliases or import conventions.

### `## Code style`
List strict coding conventions.
- Linting commands (e.g., `npx nx lint web-app`).
- Specific architectural rules (e.g., "Must follow Hexagonal Architecture").
- Prohibited dependencies or patterns.

### `## Testing instructions`
Provide the exact commands to verify code changes.
- Command to run unit tests (e.g., `npx nx test web-app`).
- Command to run end-to-end tests if applicable.
- Instructions to always run tests before concluding a task or making a PR.

### `## Routing & Domain Context`
In a monorepo, instruct the agent where to find domain-specific rules.
- Which specific sub-folders correspond to which domains.

---

## ✍️ Example of Good AGENTS.md Formats

```markdown
# AGENTS.md for AquaGest Frontend

## Dev environment tips
- Use `npx nx serve web-app` to start the frontend server.
- All new components must go in `apps/web-app/src/components/`.

## Code style
- Use strict TypeScript. No `any` types allowed.
- Follow Hexagonal Architecture. Business logic must reside in `src/domain/`.
- File size strict limit: maximum 300 lines of code.

## Testing instructions
- Always run `npx nx test web-app` before finishing a task.
- Ensure all tests pass before suggesting a pull request.
```

## 🔄 Routine Maintenance Updates

When modifying an existing `AGENTS.md`:
1. **Never delete existing valid commands** unless they have been explicitly deprecated.
2. **Sort logically**: group testing commands together, linting commands together, etc.
3. Validate that the paths and commands you are adding actually resolve correctly in the workspace.

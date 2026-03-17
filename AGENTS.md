# AquaGest - Master Agent Routing & Guidelines

**CONTEXT:** AquaGest is a comprehensive management system for water sales, washing machine rentals, and related administrative tasks.

**CRITICAL CONSTRAINT:** This is the root routing file. AquaGest is a monorepo. Depending on your task, you MUST route to the specific application's `AGENTS.md` file for detailed domain context, rules, and workflows.

## 🚦 Project Routing (START HERE)

If you are assigned a task, **IMMEDIATELY** read the corresponding `AGENTS.md` file for that workspace before writing any code:

- **▶️ Frontend Application (React/Vite/Zustand):** Go to [`apps/web-app/AGENTS.md`](apps/web-app/AGENTS.md). This is where all the business logic, UI components, and Supabase integrations live. It contains the **Domain Context Map** to route you to the specific feature (Sales, Rentals, Prepaid, etc.).

---

## Global Build, Lint, and Test Commands

- `npx nx serve web-app` - Starts the frontend development server (http://localhost:4200)
- `npx nx build web-app` - Builds the frontend (output: dist/apps/web-app)
- `npx nx test web-app` - Runs all frontend tests (Vitest)
- `npx nx lint web-app` - Runs the linter on the frontend
- `npx nx typecheck web-app` - Runs typechecking on the frontend

## Architecture Principles

- Follow Single Responsibility Principles (SRP)
- Separation of concerns: UI, Services, State
- Keep business logic outside of components when possible (use services or hooks)

## 🧠 Critical Thinking & Architecture Decision Making

- **ALWAYS question proposed decisions**, challenge assumptions, and provide alternatives when you identify potential issues or suboptimal approaches
- For every recommendation, clearly explain the "why" - the reasoning, trade-offs, and consequences
- Propose improvements even when not explicitly requested; this demonstrates architectural expertise
- When questioned or challenged on your decisions, provide rationale backed by industry best practices, design patterns, and project-specific context
- Never accept requirements at face value without analyzing their implications on the system

## 📏 File Size & Refactoring Mandate

**CRITICAL RULE:** No file should exceed 300 lines of code.

- If you analyze an existing file and it exceeds 300 lines, you MUST proactively suggest a refactoring plan to split it into smaller, single-responsibility modules.
- If you are writing or modifying a file and your changes will cause it to exceed 300 lines, STOP. You MUST activate the refactoring guidelines and split the file immediately before continuing. Do not ignore this rule under any circumstances.

## 🧠 Knowledge Base & Local Skills

This project contains a local Knowledge Base of best practices downloaded into the `.agents/skills/` directory.

**CRITICAL:** Do NOT attempt to use the `activate_skill` tool. Instead, you MUST use your file reading tools (`read_file`, `grep_search`) to read the `SKILL.md` or relevant `.md` files inside the following directories based on your task:

- **For Database, Supabase or SQL tasks:** Read files inside `.agents/skills/supabase-postgres-best-practices/`.
- **For React, Frontend Performance, and UI/UX:** Read files inside `.agents/skills/vercel-react-best-practices/` and `.agents/skills/web-design-guidelines/`.

---

## Environment

- Supabase as Backend as a Service
- Environment variables in the `.env` file at the root
- Use `npx nx` to run monorepo commands
- **CRITICAL SECURITY RULE:** Never print, log, or expose the contents of the `.env` file or credentials in your responses.

## 📋 Technical Guidelines (Task-Specific)

**CRITICAL:** You MUST read the corresponding guideline file before starting any of the following tasks:

| 🛠️ Task / Area     | 📄 Guideline File                                                                  | 🎯 Activation Condition                       |
| :----------------- | :--------------------------------------------------------------------------------- | :-------------------------------------------- |
| **🧪 Testing**     | [`docs/agents/testing-guidelines.md`](docs/agents/testing-guidelines.md)           | When asked to create, update, or run tests.   |
| **🛠️ Refactoring** | [`docs/agents/refactoring-guidelines.md`](docs/agents/refactoring-guidelines.md)   | When refactoring existing code or logic.      |
| **🐛 Debugging**   | [`docs/agents/debugging-guidelines.md`](docs/agents/debugging-guidelines.md)       | When investigating or fixing reported bugs.   |
| **🔒 Security**    | [`docs/agents/security-guidelines.md`](docs/agents/security-guidelines.md)         | When auditing code for vulnerabilities.       |
| **⚡ Performance** | [`docs/agents/optimization-guidelines.md`](docs/agents/optimization-guidelines.md) | When optimizing algorithms or execution time. |
| **🤖 AGENTS.md**   | [`docs/agents/agents-md-guidelines.md`](docs/agents/agents-md-guidelines.md)       | When asked to create, update, or modify an AGENTS.md file. |

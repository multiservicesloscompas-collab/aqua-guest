# AGENTS.md Guidelines

> [!IMPORTANT]
> **MANDATORY FOR DOCUMENTATION UPDATES:** This guide **MUST** be loaded via `view_file` **BEFORE** making any changes to `AGENTS.md` or any file within `docs/agents/`. Failure to follow these rules degrades AI performance across the monorepo.

This document defines the rules and best practices for creating and maintaining `AGENTS.md` files and supporting documentation in the `docs/agents` directory. These files are designed as high-performance **Context Routers** for AI agents.

---

## 🧭 The Core Principle: Context Management
The goal of an `AGENTS.md` file is to **load ONLY the necessary context**. Large repositories can lead to "Context Hell" where the AI is overwhelmed with irrelevant data, wasting tokens and increasing the risk of hallucinations.

### 1. The Router Pattern
Instead of containing all documentation, `AGENTS.md` must serve as a **Traffic Controller**:
- **Routing Tables:** Use tables to map task categories (Architecture, Backend, Frontend, Testing) to specific sub-documents.
- **Skill Mapping:** Explicitly list which AI skills/tools belong to which task types.
- **On-Demand Loading:** Instruct the agent to use `view_file` only when a task falls within a specific category.

### 2. Strategic Sections
Every professional `AGENTS.md` should include:
- **Project Mission:** High-level business context to inform technical decisions.
- **Project Map:** A skeletal view of the repository structure (Monorepo components, key lib locations).
- **Quality Standards:** Explicit non-negotiable technical rules (TypeScript strictness, TDD, architectural patterns).
- **Mindset & Identity:** Instructions on how the AI should "think" (e.g., Software Architect mindset).
- **Definition of Done (DoD):** A checklist for the AI to verify before final submission.

---

## 🛠️ Maintenance Rules for Agents

### 🧪 Dynamic Evolution
- **Update on Pattern Shift:** If a new architectural pattern is established (e.g., a new DI pattern or error handling utility), the agent must update `AGENTS.md` or the relevant sub-doc.
- **Refinement:** If the agent finds a section of the documentation is ambiguous or leads to repeated errors, it should propose an update.

### 🧩 Documentation Purity
- **No Redundancy:** Do not duplicate information across `AGENTS.md` and sub-docs. Keep `AGENTS.md` high-level and sub-docs specific.
- **Standard Formatting:** Use GitHub-flavored markdown with alerts (`> [!IMPORTANT]`) for critical rules.
- **Language Consistency:** Ensure all documentation for agents is in **English** to maintain a professional global standard.

---

## 🚀 Quality Assurance (Checklist)
When updating any `docs/agents/*.md` file, ensure:
1. [ ] Is the information **actionable** for an AI?
2. [ ] Does it avoid **fluff** and redundant text?
3. [ ] Are **path aliases** and **monorepo commands** correct and up-to-date?
4. [ ] Does the **Routing Table** include a clear "When to Load" trigger?

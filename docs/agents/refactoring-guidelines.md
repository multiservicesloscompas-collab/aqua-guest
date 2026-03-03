# Code Refactoring Guidelines

**CONDITIONAL ACTIVATION:** Follow these rules **ONLY** if you are explicitly asked to refactor code. Otherwise, ignore this section.

When refactoring code, you MUST apply these principles:

1.  **SOLID Principles:** Ensure Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion are respected.
2.  **Early Returns:** Use early returns to eliminate unnecessary `else` blocks and reduce deep nesting, making the logic flatter and easier to follow.
3.  **Small Reusable Functions:** Extract logic into small, focused, and ideally pure functions. Aim for functions that do only one thing.
4.  **Descriptive Naming:** Use clear, intention-revealing names for variables, constants, and functions. Avoid abbreviations that obscure meaning.
5.  **Robust Error Handling:** Ensure all potential points of failure are caught and handled gracefully (using try-catch, validation guards, or error boundaries).
6.  **Strict TypeScript:** Enforce strict typing. Avoid `any`, use `unknown` where applicable, and define precise interfaces/types for all data structures.

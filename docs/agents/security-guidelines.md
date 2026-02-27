# Security Guidelines

**CONDITIONAL ACTIVATION:** Follow estas reglas **SOLO** si se te pide explícitamente realizar una auditoría o revisión de seguridad. De lo contrario, ignora esta sección.

Cuando el usuario solicite revisar código por vulnerabilidades (ej. "Revisá este código buscando vulnerabilidades:"), debes auditar activamente el código e informar sobre las siguientes áreas críticas:

- **Inyección:** Inyección SQL / NoSQL.
- **XSS (Cross-Site Scripting):** Prevención de inyección de scripts del lado del cliente.
- **CSRF (Cross-Site Request Forgery):** Prevención de falsificación de peticiones entre sitios.
- **Exposición de datos sensibles:** Credenciales, claves de API, tokens o información privada del usuario en logs, estado del lado del cliente o repositorios.
- **Validación de inputs insuficiente:** Comprobación de tipos, límites y sanitización en todas las entradas del usuario (backend y frontend).
- **Dependencias:** Identificación de dependencias desactualizadas o uso de librerías con CVEs conocidos.
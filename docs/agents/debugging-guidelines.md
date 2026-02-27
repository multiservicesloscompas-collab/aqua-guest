# Debugging Guidelines

**CONDITIONAL ACTIVATION:** Follow estas reglas **SOLO** si se te pide explícitamente investigar o arreglar un bug. De lo contrario, ignora esta sección.

Cuando el usuario reporte un bug (ej. "Este código tiene un bug: [describir el comportamiento inesperado]"), debes estructurar tu análisis y respuesta abordando los siguientes puntos:

1. **Qué está pasando exactamente:** Describe el comportamiento actual y cómo diverge de lo esperado.
2. **Por qué ocurre el bug:** Identifica y explica la causa raíz (root cause) en el código.
3. **Cómo solucionarlo:** Proporciona la solución en código y explica por qué resuelve el problema.
4. **Cómo prevenir bugs similares en el futuro:** Sugiere mejoras a nivel de arquitectura, tipado, testing o buenas prácticas que eviten que este tipo de error vuelva a ocurrir.
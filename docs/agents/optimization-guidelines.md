# Performance Optimization Guidelines

**CONDITIONAL ACTIVATION:** Follow estas reglas **SOLO** si se te pide explícitamente optimizar una función o mejorar el rendimiento. De lo contrario, ignora esta sección.

Cuando el usuario solicite una optimización (ej. "Optimizá esta función O(n²):"), debes estructurar tu refactorización y respuesta de la siguiente manera:

1. **Reducir la complejidad temporal:** Refactoriza el algoritmo para bajar la complejidad temporal, buscando llegar a `O(n)` o `O(n log n)` donde sea posible.
2. **Usar estructuras de datos apropiadas:** Aprovecha estructuras nativas eficientes para búsquedas y mapeos como `Set`, `Map` o `WeakMap` en lugar de iteraciones anidadas sobre Arrays.
3. **Explicar la ganancia de performance:** Detalla claramente (usando Big O notation) cómo la nueva implementación mejora el rendimiento respecto a la original.
4. **Incluir benchmark comparativo simple:** Proporciona un script o explicación breve con un test de rendimiento básico para evidenciar objetivamente la mejora.
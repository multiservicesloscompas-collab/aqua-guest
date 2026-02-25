# Documentación AquaGuest

Documentación completa del sistema de gestión para bodega de recarga de agua y alquiler de lavadoras.

## 📚 Índice de Documentación

### Documentos Generales

1. **[PRD General](./prd-general.md)**
   - Descripción general del proyecto
   - Horarios de trabajo
   - Inicio de semana

2. **[Especificaciones Técnicas](./tech.md)**
   - Stack tecnológico
   - Estructura del proyecto
   - Principios de arquitectura
   - Convenciones de código

### Módulos del Sistema

#### Módulo de Agua

3. **[PRD Agua](./prd-agua.md)**
   - Productos de agua
   - Conteo de litros
   - Gestión de cantidades

4. **[PRD Agua Prepagada](./prd-prepagados.md)** ⭐ NUEVO
   - Registro de pedidos prepagados
   - Estados de pedidos
   - Gestión de entregas
   - Flujos de uso

#### Módulo de Lavadoras

5. **[PRD Lavadoras](./prd-lavadora.md)**
   - Tipos de jornadas
   - Cálculo de precios
   - Cálculo de horarios de retiro

6. **[PRD Entregas/Alquileres](./prd-entregas.md)** ⭐ NUEVO
   - Creación de alquileres
   - Estados del alquiler
   - Cálculo automático de horarios
   - Gestión de pagos
   - Extensión de tiempo
   - Flujos completos

#### Módulos de Gestión

7. **[PRD Configuración](./prd-configuracion.md)** ⭐ NUEVO
   - Gestión de tasa de cambio
   - Historial de tasas
   - Configuración de precios por litros
   - Integración con otros módulos

8. **[PRD Clientes](./prd-clientes.md)** ⭐ NUEVO
   - Registro de clientes
   - Búsqueda de clientes
   - Edición y eliminación
   - Integración con alquileres

9. **[PRD Seguimiento](./prd-seguimiento.md)** ⭐ NUEVO
   - Vista de alquileres no pagados
   - Lavadoras agendadas
   - Lavadoras enviadas
   - Extensión de alquileres
   - Flujos de seguimiento

### Recursos Visuales

10. **[Diagramas de Flujo](./diagramas-flujo.md)** ⭐ NUEVO
    - Flujo de venta de agua
    - Flujo de alquiler de lavadora
    - Flujo de agua prepagada
    - Flujo de configuración de tasa
    - Flujo de gestión de clientes
    - Flujo de seguimiento
    - Flujo de extensión de alquiler
    - Flujo de cambio de estado

11. **[Guía de Capturas de Pantalla](./guia-capturas.md)** ⭐ NUEVO
    - Estructura de carpetas
    - Capturas por módulo
    - Recomendaciones técnicas
    - Checklist completo

---

## 🎯 Guía de Lectura por Rol

### Para Desarrolladores

**Lectura obligatoria:**
1. [Especificaciones Técnicas](./tech.md)
2. [PRD General](./prd-general.md)
3. [Diagramas de Flujo](./diagramas-flujo.md)

**Por módulo a implementar:**
- Consultar el PRD específico del módulo
- Revisar el diagrama de flujo correspondiente
- Seguir las convenciones de código en tech.md

### Para Product Owners / Gerentes

**Lectura obligatoria:**
1. [PRD General](./prd-general.md)
2. Todos los PRDs de módulos

**Para entender flujos:**
- [Diagramas de Flujo](./diagramas-flujo.md)

### Para QA / Testers

**Lectura obligatoria:**
1. [PRD General](./prd-general.md)
2. PRDs de módulos a probar
3. [Diagramas de Flujo](./diagramas-flujo.md)

**Para documentar:**
- [Guía de Capturas de Pantalla](./guia-capturas.md)

### Para Diseñadores UI/UX

**Lectura obligatoria:**
1. PRDs de todos los módulos
2. [Guía de Capturas de Pantalla](./guia-capturas.md)

**Para entender interacciones:**
- [Diagramas de Flujo](./diagramas-flujo.md)

---

## 📋 Resumen de Módulos

### Módulo de Ventas (Agua)
**Propósito:** Registrar ventas de agua por litros, botellones y tapas.

**Funcionalidades principales:**
- Carrito de compras
- Múltiples productos por venta
- Cálculo automático de precios
- Métodos de pago variados
- Conteo de litros vendidos

**Documentos:** [PRD Agua](./prd-agua.md), [Diagrama de Flujo](./diagramas-flujo.md#flujo-de-venta-de-agua)

---

### Módulo de Alquileres (Lavadoras)
**Propósito:** Gestionar alquileres de lavadoras con cálculo automático de horarios.

**Funcionalidades principales:**
- Creación de alquileres
- Cálculo automático de horarios de recogida
- Gestión de estados (Agendado → Enviado → Finalizado)
- Extensión de tiempo
- Gestión de pagos
- Vinculación con clientes

**Documentos:** [PRD Lavadoras](./prd-lavadora.md), [PRD Entregas](./prd-entregas.md), [Diagramas de Flujo](./diagramas-flujo.md#flujo-de-alquiler-de-lavadora)

---

### Módulo de Agua Prepagada
**Propósito:** Gestionar pedidos de agua pagados por adelantado.

**Funcionalidades principales:**
- Registro de pedidos prepagados
- Estados: Pendiente/Entregado
- Filtrado por estado
- Marcado de entrega
- Cálculo automático de precios

**Documentos:** [PRD Prepagados](./prd-prepagados.md), [Diagramas de Flujo](./diagramas-flujo.md#flujo-de-agua-prepagada)

---

### Módulo de Seguimiento
**Propósito:** Vista consolidada de alquileres que requieren atención.

**Funcionalidades principales:**
- Vista de alquileres no pagados
- Vista de lavadoras agendadas
- Vista de lavadoras enviadas
- Extensión rápida de alquileres
- Contadores por sección

**Documentos:** [PRD Seguimiento](./prd-seguimiento.md), [Diagramas de Flujo](./diagramas-flujo.md#flujo-de-seguimiento-de-alquileres)

---

### Módulo de Clientes
**Propósito:** Base de datos de clientes frecuentes.

**Funcionalidades principales:**
- Registro de clientes
- Búsqueda en tiempo real
- Edición y eliminación
- Integración con alquileres
- Autocompletado de datos

**Documentos:** [PRD Clientes](./prd-clientes.md), [Diagramas de Flujo](./diagramas-flujo.md#flujo-de-gestión-de-clientes)

---

### Módulo de Configuración
**Propósito:** Gestión de parámetros globales del sistema.

**Funcionalidades principales:**
- Gestión de tasa de cambio
- Historial de tasas
- Configuración de precios por litros
- Última actualización
- Sincronización con Supabase

**Documentos:** [PRD Configuración](./prd-configuracion.md), [Diagramas de Flujo](./diagramas-flujo.md#flujo-de-configuración-de-tasa)

---

## 🔄 Flujos de Integración

### Venta de Agua
```
Configuración (precios) → Ventas → Dashboard (estadísticas)
```

### Alquiler de Lavadora
```
Clientes → Alquileres → Seguimiento → Dashboard
         ↓
    Configuración (tasa)
```

### Agua Prepagada
```
Configuración (precios) → Prepagados → (Entrega) → Dashboard
```

---

## 🛠️ Stack Tecnológico

### Frontend
- **Framework:** React con Vite
- **Estilos:** TailwindCSS
- **Componentes:** Radix UI (shadcn/ui)
- **Estado:** Zustand con persist
- **Fechas:** date-fns
- **Iconos:** Lucide React
- **Notificaciones:** Sonner

### Backend
- **Framework:** NestJS
- **ORM:** TypeORM
- **Base de datos:** Supabase (PostgreSQL)
- **Validación:** class-validator

### Monorepo
- **Herramienta:** Nx
- **Estructura:** apps/ y libs/

---

## 📊 Estructura de Datos Principal

### Entidades Principales

```typescript
// Ventas
Sale {
  id, date, items[], totalBs, totalUsd, 
  exchangeRate, paymentMethod
}

// Alquileres
WasherRental {
  id, date, customerId, machineId, shift,
  deliveryTime, pickupTime, pickupDate,
  totalUsd, status, isPaid
}

// Prepagados
PrepaidOrder {
  id, customerName, liters, amountBs, amountUsd,
  status, datePaid, dateDelivered
}

// Clientes
Customer {
  id, name, phone, address
}

// Configuración
AppConfig {
  exchangeRate, literPricing[], 
  exchangeRateHistory[]
}
```

---

## 🎨 Convenciones de Diseño

### Colores por Estado
- **Agendado:** Amarillo/Celeste
- **Enviado:** Azul
- **Finalizado:** Verde
- **No Pagado:** Rojo
- **Pagado:** Verde
- **Pendiente:** Amarillo
- **Entregado:** Verde

### Iconos Comunes
- 💧 Agua / Litros
- 🧺 Lavadora
- 👤 Cliente
- 💵 Dinero / Pago
- 📅 Fecha / Calendario
- 🚚 Entrega / Envío
- ⚙️ Configuración
- 📊 Dashboard / Estadísticas

---

## 📝 Próximos Pasos

### Para Completar la Documentación

1. **Capturas de Pantalla**
   - Seguir la [Guía de Capturas](./guia-capturas.md)
   - Crear carpeta `docs/screenshots/`
   - Tomar mínimo 49 capturas según checklist
   - Integrar capturas en los PRDs

2. **Diagramas de Base de Datos**
   - Crear diagrama ER de Supabase
   - Documentar relaciones entre tablas
   - Especificar tipos de datos y constraints

3. **API Documentation**
   - Documentar endpoints del backend
   - Especificar request/response
   - Ejemplos de uso

4. **Manual de Usuario**
   - Guía paso a paso para usuarios finales
   - Casos de uso comunes
   - Solución de problemas

### Para el Desarrollo

1. **Testing**
   - Escribir tests unitarios
   - Tests de integración
   - Tests E2E con Playwright

2. **Deployment**
   - Configurar CI/CD
   - Documentar proceso de deploy
   - Variables de entorno

3. **Monitoreo**
   - Configurar logging
   - Alertas de errores
   - Métricas de uso

---

## 📞 Contacto y Contribución

### Reportar Problemas
- Crear issue en el repositorio
- Incluir capturas de pantalla
- Describir pasos para reproducir

### Sugerir Mejoras
- Abrir discussion en el repositorio
- Proponer cambios en PRDs
- Actualizar documentación según cambios

### Actualizar Documentación
- Mantener PRDs actualizados con cambios
- Actualizar diagramas si cambian flujos
- Renovar capturas si cambia UI
- Versionar documentación importante

---

## 📅 Historial de Cambios

### Versión 1.0 - Febrero 2024
- ✅ Documentación inicial de módulos existentes
- ✅ PRD de Agua
- ✅ PRD de Lavadoras
- ✅ Especificaciones técnicas

### Versión 2.0 - Febrero 2024 ⭐ ACTUAL
- ✅ PRD de Configuración
- ✅ PRD de Agua Prepagada
- ✅ PRD de Seguimiento
- ✅ PRD de Entregas (Alquileres extendido)
- ✅ PRD de Clientes
- ✅ Diagramas de flujo completos
- ✅ Guía de capturas de pantalla
- ✅ README organizativo

---

## 🎯 Estado de Completitud

| Módulo | PRD | Diagrama | Capturas | Estado |
|--------|-----|----------|----------|--------|
| General | ✅ | - | - | Completo |
| Técnico | ✅ | - | - | Completo |
| Agua | ✅ | ✅ | ⏳ | Pendiente capturas |
| Lavadoras | ✅ | ✅ | ⏳ | Pendiente capturas |
| Prepagados | ✅ | ✅ | ⏳ | Pendiente capturas |
| Seguimiento | ✅ | ✅ | ⏳ | Pendiente capturas |
| Clientes | ✅ | ✅ | ⏳ | Pendiente capturas |
| Configuración | ✅ | ✅ | ⏳ | Pendiente capturas |

**Leyenda:**
- ✅ Completo
- ⏳ Pendiente
- ❌ No iniciado

---

## 📖 Glosario

- **PRD:** Product Requirements Document (Documento de Requisitos del Producto)
- **FAB:** Floating Action Button (Botón de Acción Flotante)
- **Sheet:** Panel deslizante desde abajo
- **Toast:** Notificación temporal
- **Badge:** Etiqueta de estado
- **Breakpoint:** Punto de quiebre en escala de precios
- **Jornada:** Período de alquiler de lavadora
- **Tasa:** Tasa de cambio Bolívares/USD
- **Prepagado:** Pedido pagado por adelantado
- **Supabase:** Plataforma de base de datos PostgreSQL

---

**Última actualización:** Febrero 2024
**Versión:** 2.0
**Mantenido por:** Equipo de Desarrollo AquaGuest

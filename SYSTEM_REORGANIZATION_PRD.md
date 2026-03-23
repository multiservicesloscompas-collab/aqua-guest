# Product Requirements Document (PRD): AquaGest System Reorganization

## 1. Visión y Objetivos de la Reorganización
El objetivo principal de esta reorganización es modularizar la aplicación AquaGest para que cada sección principal funcione como un módulo independiente. Se busca reducir el desorden visual y cognitivo agrupando características relacionadas en submódulos, mientras se mantiene el enfoque en las acciones más frecuentes (como registrar un egreso o una venta). No se deben alterar los comportamientos o reglas de negocio existentes, solo la estructura, la navegación y la adición de nuevas métricas.

**Metas clave:**
- **Navegación centrada en la acción:** Cada módulo debe abrir directamente en la página de "Agregar Registro" (ej. nueva venta, nuevo alquiler, nuevo egreso).
- **Submódulos accesibles:** En la parte superior de la vista de cada módulo, debe haber un botón (ícono) que despliegue o permita acceder a los submódulos (ej. métricas, configuraciones, listas históricas).
- **Métricas integradas:** Todos los módulos deben alimentar y afectar el Dashboard principal y sus métricas globales, además de tener métricas propias en sus submódulos.

## 2. Paradigma de Interfaz y Navegación
- **Layout General:** La navegación principal (sidebar o bottom bar) apuntará a los Módulos Principales (Dashboard, Agua, Lavadoras, Clientes, Egresos, Entregas/Deliveries).
- **Layout por Módulo:**
  - **Vista por Defecto:** Formulario / Interfaz de creación de registros.
  - **Acceso a Submódulos:** Ícono en el encabezado (Header) de la vista (ej. un ícono de menú, engranaje o cuadrícula) que abra un menú desplegable (Dropdown), un Drawer (Sheet) o tabs superiores para ir a:
    - Métricas del módulo.
    - Listas o historiales.
    - Configuraciones específicas (precios, gestión de entidades).

## 3. Estructura de Módulos (Definición)

### 3.1 Módulo: Agua
- **Principal (Vista por defecto):** Registro de venta (Cart / Punto de Venta de Agua).
- **Submódulos (Accesibles vía ícono superior):**
  - **Métricas de Agua:** Gráficos y KPIs específicos de ventas de agua (litros vendidos, ingresos por agua, etc.).
  - **Agua Prepagada:** Gestión de órdenes pagadas por adelantado y pendientes de entrega.
  - **Configuración de Precios:** Tarjetas de configuración de precios por litro (movido desde la configuración global).

### 3.2 Módulo: Lavadoras (Alquileres)
- **Principal (Vista por defecto):** Registro de alquileres (Nuevo alquiler / Selección de turnos).
- **Submódulos:**
  - **Métricas de Lavadoras [NUEVO]:** Rendimiento por máquina, ingresos por turnos (medio, completo), utilización de máquinas.
  - **Gestión de Máquinas Lavadoras:** Inventario, mantenimiento, estado de las lavadoras (disponible, alquilada, dañada).

### 3.3 Módulo: Entregas (Deliveries)
Se mantiene como un módulo separado. Actualmente solo se ve afectado por la logística de los alquileres de lavadoras, pero mantenerlo aislado asegura que la gestión de envíos escale independientemente.
- **Principal:** Tablero de Entregas pendientes y en curso (Logística de Lavadoras).
- **Submódulos:** Historial de entregas, Métricas de entregas (tiempo promedio, repartidores).

### 3.4 Módulo: Clientes
Dado que los clientes son transversales y consumen productos de todos los demás módulos, actúan como un directorio central.
- **Principal:** Lista / Búsqueda de clientes con filtros avanzados e historial consolidado (compras de agua, alquileres pasados).
- **Submódulos:** Casos especiales o métricas de clientes (Top clientes, deuda pendiente, retención).

### 3.5 Módulo: Finanzas (Integración de Egresos y Equilibrio)
Agrupa las gestiones de salida de dinero, ajustes de caja y configuraciones financieras globales.
- **Principal (Vista por defecto):** Formulario para registrar un nuevo egreso.
- **Submódulos:**
  - **Equilibrio de Pagos:** Herramienta para modificar y reasignar los totales entre los tipos de pago (ej. ingreso en efectivo que luego es cambiado por un pago móvil), manteniendo el cuadre.
  - **Tasa de Cambio:** Configuración de la tasa global que afectará al instante a toda la aplicación.
  - **Lista de Egresos:** Vista histórica de egresos en el tiempo.
  - **Métricas de Egresos [NUEVO]:** Distribución de salidas de dinero por categoría, evolución, etc.

### 3.6 Módulo: Dashboard (Principal)
- **Principal:** Vista panorámica analítica y de solo lectura. Muestra métricas core, ingresos netos/brutos y el consolidado de medios de pago general. Ya no contiene las configuraciones directamente.

---

## 4. Instrucciones para el LLM Implementador
- Respetar la regla de oro: **Ningún archivo debe superar las 300 líneas de código**. Cada submódulo debe ser un componente aislado.
- Mantener el estado global con Zustand (en `useAppStore.ts`).
- Crear nuevos componentes de UI basándose en Shadcn/Radix ya existentes en `src/components/ui/`.
- No alterar esquemas de la Base de Datos a menos que se requiera soporte para las nuevas métricas. Las métricas nuevas (`Métricas de lavadoras`, `Métricas de egresos`) deben calcularse en el frontend mediante servicios dedicados o en el DashboardMetricsService.
- Actualizar o crear los archivos `.md` de dominio en `apps/web-app/docs/` que reflejen de inmediato este nuevo modelo de navegación y submódulos.

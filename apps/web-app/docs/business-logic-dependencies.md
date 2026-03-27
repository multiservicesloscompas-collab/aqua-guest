# AquaGest - Diagrama de Afectación y Dependencias

Este documento detalla cómo los registros en los módulos comerciales afectan a otros componentes del sistema, incluyendo métricas del dashboard, transacciones y egresos.

![Diagrama de Dependencias AquaGest](file:///Users/kembertnieves/.gemini/antigravity/brain/f8bcef88-6c92-4b34-9289-7b6eeaabd1b1/aquagest_dependency_diagram_1774270777644.png)

## 📊 Diagrama Lógico (Mermaid)

```mermaid
graph TD
    %% Módulos Comerciales
    UA["💧 Ventas de Agua"]
    RL["🌀 Alquiler de Lavadoras"]
    
    %% Datos/Registros
    S["📄 Registro de Venta (Sales)"]
    WR["📄 Registro de Alquiler (Rentals)"]
    PS_S["🔀 Pago Mixto (Sale Splits)"]
    PS_R["🔀 Pago Mixto (Rental Splits)"]
    T["💰 Propinas (Tips)"]
    
    %% Afectación
    D["📈 Dashboard (Métricas)"]
    TS["🕒 Transacciones Generales"]
    PMD["💳 Detalle por Método de Pago"]
    E["📉 Egresos (Gastos)"]
    P["👥 Módulo de Propinas"]

    %% Relaciones
    UA --> S
    RL --> WR
    
    S --> PS_S
    WR --> PS_R
    
    S --> T
    WR --> T
    
    S -- "Suma Ingreso Bruto (Water)" --> D
    WR -- "Suma Ingreso Bruto (Rental) si está Pagado" --> D
    
    PS_S -- "Distribuye montos por método" --> PMD
    PS_R -- "Distribuye montos por método" --> PMD
    
    S -- "Timeline cronológico" --> TS
    WR -- "Timeline cronológico" --> TS
    PS_S -- "Divide registro en múltiples filas" --> TS
    PS_R -- "Divide registro en múltiples filas" --> TS
    
    T -- "Control de Pendientes/Pagadas" --> P
    T -- "Pago de Propina (Tip Payout)" --> E
    E -- "Deducción de Neto" --> D
    E -- "Métrica acumulada de gastos" --> D
    
    %% Estilos
    style UA fill:#e1f5fe,stroke:#01579b
    style RL fill:#f3e5f5,stroke:#4a148c
    style D fill:#fff9c4,stroke:#fbc02d
    style E fill:#ffebee,stroke:#b71c1c
    style T fill:#e8f5e9,stroke:#2e7d32
```

## 🧠 Análisis de Afectación

### 1. Módulos Comerciales (Agua y Alquiler)
- **Ventas de Agua**: Afectan de forma inmediata a los ingresos brutos, transacciones y métricas de litros vendidos en el dashboard.
- **Alquiler de Lavadoras**: Solo afectan financieramente al dashboard cuando se marcan como `Pagado` (`isPaid: true`). Sin embargo, aparecen en el listado de transacciones cronológicas y afectan la disponibilidad de máquinas desde su creación.

### 2. Pagos Mixtos (Mixed Payments)
- Los pagos mixtos utilizan tablas de "splits" (`sale_payment_splits`, `rental_payment_splits`).
- **Afectación en Dashboard**: Los totales por método de pago (`methodTotalsBs`) se calculan sumando cada split individualmente en lugar de asignar el total al método principal.
- **Afectación en Transacciones**: En el resumen de transacciones, un solo registro comercial se "explota" en múltiples filas, una por cada método de pago utilizado, para facilitar la conciliación de caja.

### 3. Propinas (Tips)
- Se capturan dentro del flujo de venta o alquiler pero se gestionan de forma independiente.
- **Módulo de Propinas**: Permite el seguimiento de propinas `Pendientes` vs `Pagadas`.
- **Módulo de Egresos**: **Crucial:** Una propina NO afecta los egresos ni el neto del dashboard hasta que es **pagada** (`tip_payout`). Una vez pagada, genera un registro de egreso que reduce el beneficio neto del negocio.

### 4. Dashboard y Métricas Globales
- El dashboard es un motor de cálculo en tiempo real que agrega datos de todos los módulos mencionados.
- El **Beneficio Neto** se calcula como: `(Ingresos Agua + Ingresos Alquiler Pagados + Prepagados) - (Gastos Generales + Propinas Pagadas)`.

# AquaGest

AquaGest es una plataforma moderna para la gestión integral de una bodega que recarga agua potable por litros y alquila lavadoras. La aplicación está diseñada como un monorepositorio Nx con una arquitectura robusta y escalable.

## 📋 Descripción

AquaGest permite gestionar:

- **Venta de agua potable**: Recargas por litros (1, 2, 5, 12, 19, 24 litros), venta de botellones nuevos y tapas
- **Alquiler de lavadoras**: Gestión de alquileres con diferentes turnos (medio, completo, doble)
- **Gestión de clientes**: Base de datos de clientes con autocompletado
- **Control de egresos**: Registro y categorización de gastos operativos
- **Órdenes prepagadas**: Sistema de prepago para entregas futuras
- **Gestión financiera**: Control de tasas de cambio, precios configurables y reportes

## 🕐 Horario de Trabajo

- **Lunes a Sábado**: 9:00 AM - 8:00 PM
- **Domingo**: 9:00 AM - 2:00 PM

El sistema calcula automáticamente los horarios de retiro de alquileres basándose en estos horarios comerciales.

## 🛠️ Stack Tecnológico

### Frontend (`apps/web-app`)

- **Framework**: React 19
- **Build Tool**: Vite
- **Estilos**: TailwindCSS v3.4 + Componentes Radix UI
- **Estado**: Zustand (con persistencia) + TanStack Query (React Query)
- **Routing**: React Router v7
- **Base de Datos**: Supabase (PostgreSQL)

### Backend (`apps/backend`)

- **Framework**: NestJS v11
- **Base de Datos**: SQLite (desarrollo)
- **ORM**: TypeORM
- **Arquitectura**: Hexagonal, DDD, SOLID
- **Validación**: class-validator + class-transformer
- **Logging**: Morgan

### Herramientas

- **Monorepo**: Nx
- **Lenguaje**: TypeScript
- **Testing**: Jest + Vitest

## 📦 Requisitos Previos

- Node.js (Versión LTS recomendada)
- npm o yarn
- Cuenta de Supabase (para producción)
- En Windows: usar CMD en lugar de PowerShell

## 🚀 Primeros Pasos

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Supabase (para frontend)
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima

# Supabase (para backend)
SUPABASE_URL=tu_url_de_supabase
SUPABASE_SERVICE_ROLE_KEY=tu_clave_de_servicio
SUPABASE_ANON_KEY=tu_clave_anonima
```

### 3. Iniciar el entorno de desarrollo

**Frontend** (aplicación web):

```bash
npx nx serve web-app
```

La aplicación estará disponible en [http://localhost:5173](http://localhost:5173).

**Backend** (API):

```bash
npx nx serve backend
```

El servidor estará disponible en [http://localhost:3100](http://localhost:3100).

## 📝 Funcionalidades Principales

### 💧 Gestión de Agua

- **Recargas de agua**: Sistema de precios por breakpoints de litros (1, 2, 5, 12, 19, 24 litros)
- **Venta de botellones nuevos**: Incluye automáticamente 19 litros
- **Venta de tapas**: Producto independiente
- **Conteo de litros**: Control automático para reponer stock a los 4000 litros
- **Carrito múltiple**: Un cliente puede comprar múltiples productos en una transacción

### 🌀 Alquiler de Lavadoras

- **Tipos de turno**:
  - **Medio turno**: 8 horas - $4 USD
  - **Completo**: 24 horas - $6 USD
  - **Doble**: 48 horas - $12 USD
- **Cálculo automático**: Precios en USD convertidos a Bs según tasa de cambio del día
- **Horarios inteligentes**: Cálculo automático de retiros respetando horario comercial
- **Estados**: Agendado, Enviado, Finalizado
- **Costo de entrega**: Configurable entre $0 - $5 USD

### 👥 Gestión de Clientes

- Base de datos de clientes con autocompletado
- Información: Nombre, teléfono, dirección
- Vinculación automática con alquileres y prepagados

### 💰 Control Financiero

- **Tasas de cambio**: Historial diario de tasas Bs/USD
- **Precios configurables**: Breakpoints de precios por litros editables
- **Métodos de pago**: Efectivo, Pago Móvil, Punto de Venta
- **Reportes**: Dashboard con estadísticas de ventas y egresos

### 📊 Egresos

- Registro de gastos categorizados:
  - Operativo
  - Insumos
  - Servicios
  - Mantenimiento
  - Personal
  - Otros
- Filtrado por fecha

### 📦 Órdenes Prepagadas

- Sistema de prepago para entregas futuras
- Seguimiento de estado: Pendiente, Entregado
- Control de fechas de pago y entrega

## 🏗️ Arquitectura y Convenciones

### Principios de Diseño

- **Arquitectura Hexagonal**: Separación clara entre dominio, aplicación e infraestructura
- **DDD (Domain-Driven Design)**: Modelado basado en el dominio del negocio
- **SOLID**: Principios de diseño orientado a objetos

### Convenciones de Código

#### Base de Datos (TypeORM)

- **Tablas**: Nombres en inglés y plural (`clients`, `sales`, `rentals`)
- **Entidades**: CamelCase (`Client`, `Sale`, `WasherRental`)
- **Columnas en código**: CamelCase (`customerId`, `totalUsd`)
- **Columnas en BD**: Snake_case (`customer_id`, `total_usd`)

#### Estructura del Proyecto

```
apps/
├── backend/          # API NestJS
│   └── src/app/
│       ├── clients/     # Módulo de clientes
│       ├── sales/       # Módulo de ventas
│       ├── rentals/     # Módulo de alquileres
│       ├── expenses/    # Módulo de egresos
│       ├── rates/       # Módulo de tasas de cambio
│       ├── migration/   # Módulo de migración
│       └── supabase/    # Servicio de Supabase
│
└── web-app/          # Frontend React
    └── src/
        ├── pages/       # Páginas principales
        ├── components/  # Componentes UI
        ├── store/       # Estado global (Zustand)
        ├── types/       # Definiciones TypeScript
        └── lib/         # Utilidades

libs/
└── models/           # Librería compartida de modelos

docs/                 # Documentación del proyecto
├── prd-general.md
├── prd-agua.md
├── prd-lavadora.md
└── tech.md
```

## 🔧 Comandos Útiles

### Desarrollo

```bash
# Frontend
npx nx serve web-app

# Backend
npx nx serve backend

# Ambos en paralelo (si está configurado)
npx nx run-many --target=serve --projects=web-app,backend
```

### Construcción (Build)

```bash
# Frontend
npx nx build web-app

# Backend
npx nx build backend

# Todos los proyectos
npx nx run-many --target=build --all
```

### Tests

```bash
# Frontend
npx nx test web-app

# Backend
npx nx test backend

# Todos los tests
npx nx run-many --target=test --all
```

### Linting

```bash
# Lint de un proyecto específico
npx nx lint web-app
npx nx lint backend

# Lint de todos los proyectos
npx nx run-many --target=lint --all
```

### Type Checking

```bash
npx nx typecheck web-app
npx nx typecheck backend
```

## 📚 Documentación

La documentación detallada del proyecto se encuentra en la carpeta `docs/`:

- [`docs/prd-general.md`](docs/prd-general.md) - Descripción general y horarios
- [`docs/prd-agua.md`](docs/prd-agua.md) - Especificaciones de venta de agua
- [`docs/prd-lavadora.md`](docs/prd-lavadora.md) - Especificaciones de alquiler de lavadoras
- [`docs/tech.md`](docs/tech.md) - Especificaciones técnicas y convenciones

## 🚢 Despliegue

### Frontend (Vercel)

El proyecto está configurado para desplegarse en Vercel. El archivo `vercel.json` contiene la configuración necesaria.

```bash
# Build para producción
npx nx build web-app

# El directorio de salida es: dist/apps/web-app
```

### Backend

El backend puede desplegarse como servicio Node.js estándar:

```bash
# Build para producción
npx nx build backend

# El directorio de salida es: apps/backend/dist
```

## 🤝 Contribución

Al trabajar en este proyecto, ten en cuenta:

1. Seguir las convenciones de código establecidas
2. Mantener la arquitectura hexagonal cuando sea posible
3. Aplicar principios DDD y SOLID
4. Escribir tests para nuevas funcionalidades
5. Documentar cambios importantes

## 📄 Licencia

MIT

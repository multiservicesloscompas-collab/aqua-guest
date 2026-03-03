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
- **Base de Datos / Backend as a Service**: Supabase (PostgreSQL)

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
# Supabase
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima
```

### 3. Iniciar el entorno de desarrollo

**Frontend** (aplicación web):

```bash
npx nx serve web-app
```

La aplicación estará disponible en [http://localhost:4200](http://localhost:4200).

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
- **Métodos de pago**: Efectivo, Pago Móvil, Punto de Venta, Divisa
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

## 🏗️ Estructura del Proyecto

```text
apps/
└── web-app/          # Frontend React
    └── src/
        ├── components/  # Componentes UI
        ├── data/        # Datos por defecto
        ├── hooks/       # Custom hooks
        ├── lib/         # Utilidades y configuración (Supabase)
        ├── pages/       # Páginas principales de la app
        ├── services/    # Servicios para lógica de negocio
        ├── store/       # Estado global (Zustand)
        └── types/       # Definiciones TypeScript

libs/
└── models/           # Librería compartida de modelos

docs/                 # Documentación del proyecto
```

## 🔧 Comandos Útiles

### Desarrollo

```bash
npx nx serve web-app
```

### Construcción (Build)

```bash
npx nx build web-app
```

### Tests

```bash
npx nx test web-app
```

### Linting

```bash
npx nx lint web-app
```

### Type Checking

```bash
npx nx typecheck web-app
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

## 🤝 Contribución

Al trabajar en este proyecto, ten en cuenta:

1. Seguir las convenciones de código establecidas
2. Mantener una arquitectura limpia y componentes modulares
3. Escribir tests para nuevas funcionalidades
4. Documentar cambios importantes

## 📄 Licencia

MIT

# AquaGest

AquaGest es una aplicación moderna gestionada como un monorepositorio Nx, diseñada con una arquitectura robusta y escalable.

## Stack Tecnológico

El proyecto utiliza las siguientes tecnologías principales:

### Frontend (`apps/web-app`)

- **Framework**: React 19
- **Build Tool**: Vite (rápido y eficiente)
- **Estilos**: TailwindCSS v3.4 + Componentes Radix UI
- **Estado**: Zustand + TanStack Query (React Query)
- **Routing**: React Router v7

### Backend (`apps/backend`)

- **Framework**: NestJS v11
- **Base de Datos**: SQLite
- **ORM**: TypeORM
- **Arquitectura**: Hexagonal, DDD, SOLID

## Requisitos Previos

- Node.js (Versión LTS recomendada)
- npm o yarn

## Primeros Pasos

1.  **Instalar dependencias**:

    ```bash
    npm install
    ```

2.  **Iniciar el entorno de desarrollo**:

    Para iniciar la aplicación web:

    ```bash
    npx nx serve web-app
    ```

    La aplicación estará disponible en [http://localhost:4200](http://localhost:4200).

    Para iniciar el backend:

    ```bash
    npx nx serve backend
    ```

## Comandos Útiles

### Construcción (Build)

Para generar los archivos de producción:

```bash
# Frontend
npx nx build web-app

# Backend
npx nx build backend
```

### Tests

```bash
npx nx test web-app
npx nx test backend
```

## Estructura del Proyecto

- **`apps/`**: Contiene las aplicaciones principales.
  - `web-app`: Cliente React.
  - `backend`: Servidor API NestJS.
- **`libs/`**: Librerías compartidas (ej. `models`).
- **`documents/`**: Documentación técnica detallada.

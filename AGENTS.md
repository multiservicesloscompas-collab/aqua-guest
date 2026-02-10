# AquaGest - Agent Coding Guidelines

## Build, Lint, and Test Commands

### Development
- `npx nx serve web-app` - Start frontend dev server (http://localhost:5173)
- `npx nx serve backend` - Start backend dev server (http://localhost:3100)

### Build
- `npx nx build web-app` - Build frontend (output: dist/apps/web-app)
- `npx nx build backend` - Build backend (output: apps/backend/dist)
- `npx nx run-many --target=build --all` - Build all projects

### Testing
- `npx nx test web-app` - Run all frontend tests (Vitest)
- `npx nx test backend` - Run all backend tests (Jest)
- `npx nx run-many --target=test --all` - Run all tests

### Running a Single Test
- Frontend (Vitest): `npx vitest run path/to/test.test.tsx` or `npx vitest path/to/test.test.tsx`
- Backend (Jest): `npx jest path/to/test.spec.ts`
- With filter: `npx vitest --run -t "test name"`

### Linting
- `npx nx lint web-app` - Lint frontend
- `npx nx lint backend` - Lint backend
- `npx nx run-many --target=lint --all` - Lint all projects

### Type Checking
- `npx nx typecheck web-app` - Typecheck frontend
- `npx nx typecheck backend` - Typecheck backend

## Code Style Guidelines

### Import Organization
- Third-party imports first (React, libraries)
- Internal imports second (with `@/` alias for absolute paths)
- Named imports preferred over default where possible
- Group related imports together

```typescript
import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Sale, PaymentMethod } from '@/types';
```

### Formatting
- Prettier configured with single quotes
- Use `prettier --write .` to format all files
- ES2022 target, strict TypeScript enabled

### Naming Conventions

#### Backend (NestJS/TypeORM)
- **Tables**: English and plural (`sales`, `clients`, `washer_rentals`)
- **Entities**: PascalCase (`Sale`, `Client`, `WasherRental`)
- **Columns in code**: camelCase (`customerId`, `totalUsd`)
- **Columns in database**: snake_case (use `@Column({ name: 'column_name' })`)
- **Services**: PascalCase + "Service" suffix (`SalesService`)
- **DTOs**: PascalCase + "Dto" suffix (`CreateSaleDto`)
- **Methods**: camelCase (`findAll`, `create`, `update`)

#### Frontend (React)
- **Components**: PascalCase (`SalesList`, `DashboardPage`)
- **Hooks**: camelCase starting with "use" (`useMobile`, `useAppStore`)
- **Types/Interfaces**: PascalCase (`Sale`, `PaymentMethod`, `CartItem`)
- **Constants**: UPPER_SNAKE_CASE for export constants (`DEFAULT_LITER_BREAKPOINTS`)
- **Functions**: camelCase (`addToCart`, `deleteSale`)

### Type Definitions
- Use strict TypeScript with no implicit any
- Define shared types in `apps/web-app/src/types` or `libs/models`
- Payment methods: `'efectivo' | 'pago_movil' | 'punto_venta' | 'divisa'`
- Dates stored as strings in `'YYYY-MM-DD'` format
- Timestamps in ISO 8601 format

### Error Handling

#### Backend
- Use NestJS built-in exceptions (`NotFoundException`, `BadRequestException`)
- Try-catch in service methods with appropriate error logging
- Return meaningful error messages to clients

#### Frontend
- Use try-catch in async functions
- Display errors using toast notifications (Sonner)
- Fallback to local state if Supabase fails
- Log errors with `console.error` for debugging

```typescript
try {
  await supabase.from('sales').insert(payload);
} catch (err) {
  console.error('Failed to add sale', err);
  toast.error('Error al agregar venta');
  // Fallback to local state
}
```

### State Management
- Zustand for global state with persistence
- TanStack Query for server state (if needed)
- Keep local state in components where possible
- Use Immer or spread operators for immutable updates

### Database (TypeORM)
- Entities extend `BaseEntity` when available
- Use relations (`@OneToMany`, `@ManyToOne`) appropriately
- Use cascade options for related entity management
- Decimal columns for monetary values

### React Component Patterns
- Functional components with hooks
- Props interfaces defined above component
- Extract reusable logic into custom hooks
- Use `useMemo` for expensive computations
- Use `useCallback` for event handlers passed to children

### Styling (TailwindCSS)
- Use utility-first approach
- Group related classes: `flex items-center justify-between`
- Use Tailwind's arbitrary values sparingly
- Responsive design with mobile-first approach
- Use Radix UI primitives for accessible components

### Date Handling
- Store dates as `YYYY-MM-DD` strings
- Use `date-fns` for date manipulations
- Handle timezones carefully - use local time strings
- Construct date strings manually to avoid timezone issues:
```typescript
const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
```

### Payment Methods
- `'efectivo'` - Cash (Banknote icon)
- `'pago_movil'` - Mobile Payment (Smartphone icon)
- `'punto_venta'` - POS Terminal (CreditCard icon)
- `'divisa'` - Foreign currency (DollarSign icon)

### Testing Guidelines
- Use Jest
- Test library for React components
- Mock external dependencies (Supabase, store, icons)
- Write descriptive test names in Spanish or English
- Test happy path and edge cases
- Use `data-testid` attributes for selecting elements

```typescript
describe('SalesList Component', () => {
  it('debería renderizar correctamente con ventas', () => {
    render(<SalesList sales={sales} />);
    expect(screen.getByText('Ventas del Día (1)')).toBeInTheDocument();
  });
});
```

## Architecture Principles
- Follow hexagonal/DDD/SOLID principles
- Separate concerns: domain, application, infrastructure
- Keep business logic in services/domain layer

## Environment
- Use CMD instead of PowerShell (Windows)
- Supabase (production), SQLite (local backend)
- Environment variables in root `.env` file

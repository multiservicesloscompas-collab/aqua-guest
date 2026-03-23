import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Droplets } from 'lucide-react';
import { PaymentMethodTransactionsCard } from './PaymentMethodTransactionsCard';

describe('PaymentMethodTransactionsCard', () => {
  it('renders method badge for mixed transaction rows', () => {
    render(
      <PaymentMethodTransactionsCard
        count={1}
        emptyMessage="Vacío"
        emptyIcon={Droplets}
        items={[
          {
            key: 'sale-1',
            typeLabel: 'Venta de Agua · Pago mixto',
            description: '2 productos',
            linkedReference: 'Venta #15',
            amountText: 'Bs 80.00',
            amountUsdText: '$1.60',
            paymentMethodLabel: 'Pago Móvil',
            icon: Droplets,
            containerClass: 'bg-muted/30 border-border',
            iconWrapperClass: 'bg-blue-100 text-blue-600',
            iconClass: 'text-blue-600',
            amountClass: 'text-foreground',
          },
        ]}
      />
    );

    expect(screen.getByText('Venta de Agua · Pago mixto')).toBeInTheDocument();
    expect(screen.getByText('Pago Móvil')).toBeInTheDocument();
    expect(screen.getByText('Venta #15')).toBeInTheDocument();
  });

  it('renders avance labels and difference text for balance rows', () => {
    render(
      <PaymentMethodTransactionsCard
        count={1}
        emptyMessage="Vacío"
        emptyIcon={Droplets}
        items={[
          {
            key: 'avance-out-1',
            typeLabel: 'Avance (Salida)',
            description:
              'Transferencia a Efectivo · Salida 80,00 · Dif -Bs 5,00',
            linkedReference: 'Avance #tx-avance',
            amountText: '-Bs 80,00',
            icon: Droplets,
            containerClass: 'bg-red-50/50 border-red-100',
            iconWrapperClass: 'bg-red-100 text-red-600',
            iconClass: 'text-red-600',
            amountClass: 'text-red-600',
          },
        ]}
      />
    );

    expect(screen.getByText('Avance (Salida)')).toBeInTheDocument();
    expect(screen.getByText('Avance #tx-avance')).toBeInTheDocument();
    expect(screen.getByText(/Dif -Bs 5,00/)).toBeInTheDocument();
  });
});

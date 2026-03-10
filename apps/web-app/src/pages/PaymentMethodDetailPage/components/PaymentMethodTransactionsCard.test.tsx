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
  });
});

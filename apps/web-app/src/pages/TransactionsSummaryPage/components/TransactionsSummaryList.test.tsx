import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TransactionsSummaryList } from './TransactionsSummaryList';

describe('TransactionsSummaryList', () => {
  it('renders mixed payment badge and hides badge when method is undefined', () => {
    render(
      <TransactionsSummaryList
        transactions={[
          {
            id: 'sale-1',
            type: 'sale',
            title: 'Venta de Agua #1',
            subtitle: '1 item',
            amountBs: 50,
            amountUsd: 1,
            isIncome: true,
            paymentMethod: 'Pago mixto · Efectivo',
            timestamp: '2026-03-10T10:00:00.000Z',
            originalDate: '2026-03-10',
          },
          {
            id: 'expense-1',
            type: 'expense',
            title: 'Operativo',
            subtitle: 'Compra',
            amountBs: 20,
            isIncome: false,
            paymentMethod: undefined,
            timestamp: '2026-03-10T11:00:00.000Z',
            originalDate: '2026-03-10',
          },
        ]}
      />
    );

    expect(screen.getByText('Pago mixto · Efectivo')).toBeInTheDocument();
    expect(screen.queryByText('undefined')).not.toBeInTheDocument();
  });

  it('renders tip payout amount as negative', () => {
    render(
      <TransactionsSummaryList
        transactions={[
          {
            id: 'tip-payout-1',
            type: 'tip_payout',
            title: 'Pago de propinas',
            subtitle: 'Liquidacion diaria',
            amountBs: 100,
            amountUsd: 2,
            isIncome: false,
            paymentMethod: 'Efectivo',
            timestamp: '2026-03-10T12:00:00.000Z',
            originalDate: '2026-03-10',
          },
        ]}
      />
    );

    expect(screen.getByText(/- Bs 100,00/)).toBeInTheDocument();
    expect(screen.queryByText(/\+ Bs 100,00/)).not.toBeInTheDocument();
  });

  it('renders avance transfer row labels and in amount', () => {
    render(
      <TransactionsSummaryList
        transactions={[
          {
            id: 'tx-avance-1',
            type: 'balance_transfer',
            title: 'Avance entre Métodos',
            subtitle:
              'Pago Móvil ➔ Efectivo · Salida Bs 80,00 · Entrada Bs 75,00 · Dif -Bs 5,00',
            amountBs: 75,
            isIncome: true,
            paymentMethod: 'Transferencia · Avance',
            timestamp: '2026-03-10T12:00:00.000Z',
            originalDate: '2026-03-10',
          },
        ]}
      />
    );

    expect(screen.getByText('Avance entre Métodos')).toBeInTheDocument();
    expect(screen.getByText('Transferencia · Avance')).toBeInTheDocument();
    expect(screen.getByText(/\+ Bs 75,00/)).toBeInTheDocument();
  });
});

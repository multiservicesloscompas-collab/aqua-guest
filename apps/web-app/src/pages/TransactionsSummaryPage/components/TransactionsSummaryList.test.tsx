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
});

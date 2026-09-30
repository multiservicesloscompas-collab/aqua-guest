import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { WaterMetricsBreakdownList } from './WaterMetricsBreakdownList';
import type { LiterBreakdown } from '../hooks/useWaterMetricsViewModel';

vi.mock('@/store/useConfigStore', () => ({
  useConfigStore: () => ({ config: { exchangeRate: 100 } }),
}));

const breakdown: LiterBreakdown[] = [
  { liters: 19, count: 3, totalLiters: 57, totalBs: 1234567.891 },
];

const twoDecimals = (amount: number) =>
  amount.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

describe('WaterMetricsBreakdownList', () => {
  it('shows each row total in Bs with the symbol and two decimals', () => {
    // Arrange / Act
    render(
      <WaterMetricsBreakdownList
        breakdown={breakdown}
        salesCount={3}
        totalLiters={57}
      />
    );

    // Assert
    expect(
      screen.getByText(`Bs ${twoDecimals(breakdown[0].totalBs)}`)
    ).toBeInTheDocument();
  });

  it('shows each row total in USD converted with the exchange rate', () => {
    // Arrange / Act
    render(
      <WaterMetricsBreakdownList
        breakdown={breakdown}
        salesCount={3}
        totalLiters={57}
      />
    );

    // Assert
    expect(
      screen.getByText(`$${twoDecimals(breakdown[0].totalBs / 100)}`)
    ).toBeInTheDocument();
  });

  it('shows the empty message when there is no breakdown', () => {
    // Arrange / Act
    render(
      <WaterMetricsBreakdownList
        breakdown={[]}
        salesCount={0}
        totalLiters={0}
      />
    );

    // Assert
    expect(
      screen.getByText('No hay ventas con litros en este período')
    ).toBeInTheDocument();
  });
});

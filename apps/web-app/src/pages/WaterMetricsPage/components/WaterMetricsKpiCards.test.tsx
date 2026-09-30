import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { WaterMetricsKpiCards } from './WaterMetricsKpiCards';
import type { WaterMetrics } from '../hooks/useWaterMetricsViewModel';

const metrics: WaterMetrics = {
  totalLiters: 1520,
  equivalentBottles: 80,
  totalBs: 1234567.891,
  totalUsd: 25000.5,
  breakdown: [],
  salesCount: 12,
};

const twoDecimals = (amount: number) =>
  amount.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

describe('WaterMetricsKpiCards', () => {
  it('shows the total in Bs with the symbol and two decimals', () => {
    // Arrange / Act
    render(<WaterMetricsKpiCards metrics={metrics} />);

    // Assert
    expect(
      screen.getByText(`Bs ${twoDecimals(metrics.totalBs)}`)
    ).toBeInTheDocument();
  });

  it('shows the total in USD with the symbol, a space and two decimals', () => {
    // Arrange / Act
    render(<WaterMetricsKpiCards metrics={metrics} />);

    // Assert
    expect(
      screen.getByText(`$ ${twoDecimals(metrics.totalUsd)}`)
    ).toBeInTheDocument();
  });

  it('shows the liters with no decimals', () => {
    // Arrange / Act
    render(<WaterMetricsKpiCards metrics={metrics} />);

    // Assert
    expect(
      screen.getByText(
        metrics.totalLiters.toLocaleString('es-VE', {
          maximumFractionDigits: 0,
        })
      )
    ).toBeInTheDocument();
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { WaterPricingConfigPage } from './WaterPricingConfigPage';
import { useConfigStore } from '@/store/useConfigStore';
import { defaultProducts } from '@/data/products';

const { toastSuccessMock, toastErrorMock } = vi.hoisted(() => ({
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: toastSuccessMock,
    error: toastErrorMock,
  },
}));

describe('WaterPricingConfigPage', () => {
  beforeEach(() => {
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();

    useConfigStore.setState({
      products: defaultProducts,
      config: {
        exchangeRate: 36.5,
        lastUpdated: new Date().toISOString(),
        literPricing: [
          { breakpoint: 2, price: 40 },
          { breakpoint: 19, price: 240 },
        ],
        exchangeRateHistory: [],
      },
    });
  });

  it('renders both liter pricing and Lavado Profundo card', () => {
    render(<WaterPricingConfigPage />);

    expect(screen.getByText('Precios por Litros')).toBeInTheDocument();
    expect(screen.getByText('Lavado profundo')).toBeInTheDocument();
    expect(
      screen.getByText('Precio unitario por servicio de lavado')
    ).toBeInTheDocument();
  });

  it('allows updating and saving Lavado Profundo price', async () => {
    render(<WaterPricingConfigPage />);

    const inputs = screen.getAllByRole('spinbutton');
    // Last spinbutton is the deep wash input
    const deepWashInput = inputs[inputs.length - 1];

    expect(deepWashInput).toHaveValue(1800);

    fireEvent.change(deepWashInput, { target: { value: '2000' } });
    expect(deepWashInput).toHaveValue(2000);

    const saveButtons = screen.getAllByRole('button', { name: /guardar precio/i });
    const deepWashSaveButton = saveButtons[saveButtons.length - 1];

    fireEvent.click(deepWashSaveButton);

    await waitFor(() => {
      expect(toastSuccessMock).toHaveBeenCalledWith(
        'Precio de Lavado Profundo actualizado'
      );
    });

    const updatedProduct = useConfigStore
      .getState()
      .products.find((p) => p.id === 'lavado-profundo');
    expect(updatedProduct?.defaultPrice).toBe(2000);
  });

  it('shows error if invalid price is submitted', async () => {
    render(<WaterPricingConfigPage />);

    const inputs = screen.getAllByRole('spinbutton');
    const deepWashInput = inputs[inputs.length - 1];

    fireEvent.change(deepWashInput, { target: { value: '0' } });

    const saveButtons = screen.getAllByRole('button', { name: /guardar precio/i });
    const deepWashSaveButton = saveButtons[saveButtons.length - 1];

    fireEvent.click(deepWashSaveButton);

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        'El precio debe ser mayor a 0'
      );
    });
  });
});

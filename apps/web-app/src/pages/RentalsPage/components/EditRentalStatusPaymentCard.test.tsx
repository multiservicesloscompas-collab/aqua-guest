import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EditRentalStatusPaymentCard } from './EditRentalStatusPaymentCard';

const baseProps = {
  statusOptions: [
    { value: 'agendado' as const, label: 'Agendado' },
    { value: 'enviado' as const, label: 'Enviado' },
  ],
  status: 'agendado' as const,
  onChangeStatus: vi.fn(),
  paymentStatus: 'pending' as const,
  onChangePaymentStatus: vi.fn(),
  isPaid: false,
  paidDateLabel: 'Seleccionar fecha',
  datePaid: '',
  onChangeDatePaid: vi.fn(),
  isCalendarOpen: false,
  onCalendarOpenChange: vi.fn(),
};

describe('EditRentalStatusPaymentCard', () => {
  it('renders static Agendado status in non-editable mode', () => {
    render(
      <EditRentalStatusPaymentCard {...baseProps} statusEditable={false} />
    );

    expect(screen.getByTestId('rental-status-static')).toBeInTheDocument();
    expect(screen.getByText('Agendado')).toBeInTheDocument();
    expect(screen.getByText('Estado inicial del alquiler')).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).toBeInTheDocument();
    expect(screen.getAllByRole('combobox')).toHaveLength(1);
  });
});

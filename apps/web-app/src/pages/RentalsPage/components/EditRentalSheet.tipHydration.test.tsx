import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { PaymentMethod, WasherRental } from '@/types';
import { EditRentalSheet } from './EditRentalSheet';

const useEditRentalSheetViewModelMock = vi.fn();

vi.mock('../hooks/useEditRentalSheetViewModel', () => ({
  useEditRentalSheetViewModel: (args: unknown) =>
    useEditRentalSheetViewModelMock(args),
}));

vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SheetContent: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  SheetHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}));

vi.mock('./RentalMachineSelector', () => ({
  RentalMachineSelector: () => <div />,
}));
vi.mock('./RentalShiftSelector', () => ({
  RentalShiftSelector: () => <div />,
}));
vi.mock('./RentalPaymentMethodSelector', () => ({
  RentalPaymentMethodSelector: () => <div />,
}));
vi.mock('./RentalDeliveryTimeSelector', () => ({
  RentalDeliveryTimeSelector: () => <div />,
}));
vi.mock('./RentalDeliveryFeeSelector', () => ({
  RentalDeliveryFeeSelector: () => <div />,
}));
vi.mock('./RentalCustomerSection', () => ({
  RentalCustomerSection: () => <div />,
}));
vi.mock('./RentalNotesSection', () => ({
  RentalNotesSection: () => <div />,
}));
vi.mock('./RentalSheetFooter', () => ({
  RentalSheetFooter: () => <div />,
}));
vi.mock('./EditRentalStatusPaymentCard', () => ({
  EditRentalStatusPaymentCard: () => <div />,
}));
vi.mock('@/components/payments/MixedPaymentCard', () => ({
  MixedPaymentCard: () => <div />,
}));

vi.mock('@/components/tips/TipCaptureCard', () => ({
  TipCaptureCard: ({
    enabled,
    amount,
    notes,
  }: {
    enabled: boolean;
    amount: string;
    paymentMethod: PaymentMethod;
    notes: string;
  }) => (
    <div>
      <span data-testid="tip-enabled">{String(enabled)}</span>
      <span data-testid="tip-amount">{amount}</span>
      <span data-testid="tip-notes">{notes}</span>
    </div>
  ),
}));

function buildRental(id: string): WasherRental {
  return {
    id,
    date: '2026-03-15',
    customerId: 'customer-1',
    customerName: 'Cliente',
    customerPhone: '0414',
    customerAddress: 'Centro',
    machineId: 'machine-1',
    shift: 'medio',
    deliveryTime: '09:00',
    pickupTime: '13:00',
    pickupDate: '2026-03-15',
    deliveryFee: 0,
    totalUsd: 2,
    paymentMethod: 'efectivo',
    status: 'agendado',
    isPaid: false,
    createdAt: '2026-03-15T08:00:00.000Z',
    updatedAt: '2026-03-15T08:00:00.000Z',
  };
}

function buildViewModel(overrides?: Partial<Record<string, unknown>>) {
  return {
    statusOptions: [],
    status: 'agendado',
    onChangeStatus: vi.fn(),
    isPaid: false,
    paidDateLabel: 'Seleccionar fecha',
    datePaid: '',
    onChangeDatePaid: vi.fn(),
    isCalendarOpen: false,
    setIsCalendarOpen: vi.fn(),
    onChangePaymentStatus: vi.fn(),
    machineItems: [],
    selectedMachineId: 'machine-1',
    onSelectMachine: vi.fn(),
    shiftOptions: [],
    selectedShift: 'medio',
    onSelectShift: vi.fn(),
    paymentMethodOptions: [],
    selectedPaymentMethod: 'efectivo',
    onSelectPaymentMethod: vi.fn(),
    split1Amount: '',
    split2Method: 'pago_movil',
    onChangeSplit1Amount: vi.fn(),
    onSelectSplit2Method: vi.fn(),
    isMixedPaymentEnabled: false,
    isMixedPayment: false,
    onToggleMixedPayment: vi.fn(),
    deliveryTime: '09:00',
    timeSlots: [],
    pickupLabel: 'Hoy 1:00 PM',
    onSelectDeliveryTime: vi.fn(),
    deliveryFeeOptions: [0],
    deliveryFee: 0,
    onSelectDeliveryFee: vi.fn(),
    customers: [],
    selectedCustomerId: null,
    customerName: 'Cliente',
    customerPhone: '0414',
    customerAddress: 'Centro',
    onSelectCustomer: vi.fn(),
    onChangeCustomerName: vi.fn(),
    onChangeCustomerPhone: vi.fn(),
    onChangeCustomerAddress: vi.fn(),
    notes: '',
    onChangeNotes: vi.fn(),
    subtotalUsdText: '2.00',
    tipAmountBs: 0,
    totalUsdText: '2.00',
    totalBs: 100,
    isLoading: false,
    onSubmit: vi.fn(),
    tipEnabled: false,
    tipAmount: '',
    tipPaymentMethod: 'efectivo',
    tipNotes: '',
    onToggleTip: vi.fn(),
    onChangeTipAmount: vi.fn(),
    onChangeTipPaymentMethod: vi.fn(),
    onChangeTipNotes: vi.fn(),
    ...overrides,
  };
}

describe('EditRentalSheet tip hydration rendering', () => {
  it('renders prefilled tip values when view-model provides hydrated tip', () => {
    useEditRentalSheetViewModelMock.mockReturnValueOnce(
      buildViewModel({
        tipEnabled: true,
        tipAmount: '55',
        tipNotes: 'cliente satisfecho',
      })
    );

    render(
      <EditRentalSheet
        rental={buildRental('rental-1')}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    expect(screen.getByTestId('tip-enabled')).toHaveTextContent('true');
    expect(screen.getByTestId('tip-amount')).toHaveTextContent('55');
    expect(screen.getByTestId('tip-notes')).toHaveTextContent(
      'cliente satisfecho'
    );
  });

  it('updates tip values when switching edited rentals', () => {
    useEditRentalSheetViewModelMock
      .mockReturnValueOnce(
        buildViewModel({
          tipEnabled: true,
          tipAmount: '10',
          tipNotes: 'tip-a',
        })
      )
      .mockReturnValueOnce(
        buildViewModel({
          tipEnabled: true,
          tipAmount: '90',
          tipNotes: 'tip-b',
        })
      );

    const { rerender } = render(
      <EditRentalSheet
        rental={buildRental('rental-a')}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    expect(screen.getByTestId('tip-amount')).toHaveTextContent('10');

    rerender(
      <EditRentalSheet
        rental={buildRental('rental-b')}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    expect(screen.getByTestId('tip-amount')).toHaveTextContent('90');
    expect(screen.getByTestId('tip-notes')).toHaveTextContent('tip-b');
  });
});

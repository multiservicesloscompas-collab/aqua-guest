import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import type { WasherRental } from '@/types';
import { RentalSheet } from './RentalSheet';
import { EditRentalSheet } from './EditRentalSheet';

const toggleCreateMixedPaymentMock = vi.fn();
const toggleEditMixedPaymentMock = vi.fn();

let isCreateMixedPaymentActive = false;
let isEditMixedPaymentActive = false;

const paymentOptions = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'pago_movil', label: 'Pago Móvil' },
];

vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SheetContent: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  SheetHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}));

vi.mock('../hooks/useRentalSheetViewModel', () => ({
  useRentalSheetViewModel: () => ({
    machineItems: [],
    selectedMachineId: '',
    onSelectMachine: vi.fn(),
    shiftOptions: [],
    selectedShift: 'completo',
    onSelectShift: vi.fn(),
    paymentMethodOptions: paymentOptions,
    selectedPaymentMethod: 'efectivo',
    onSelectPaymentMethod: vi.fn(),
    split1Amount: '70',
    split2Method: 'pago_movil',
    split2AmountText: 'Bs 70.00',
    onChangeSplit1Amount: vi.fn(),
    onSelectSplit2Method: vi.fn(),
    isMixedPaymentEnabled: true,
    isMixedPayment: isCreateMixedPaymentActive,
    onToggleMixedPayment: toggleCreateMixedPaymentMock,
    deliveryTime: '09:00',
    timeSlots: [],
    pickupLabel: 'Hoy 1:00 PM',
    onSelectDeliveryTime: vi.fn(),
    deliveryFeeOptions: [0],
    deliveryFee: 0,
    onSelectDeliveryFee: vi.fn(),
    customers: [],
    selectedCustomerId: null,
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    onSelectCustomer: vi.fn(),
    onCreateNewCustomer: vi.fn(),
    onChangeCustomerName: vi.fn(),
    onChangeCustomerPhone: vi.fn(),
    onChangeCustomerAddress: vi.fn(),
    notes: '',
    onChangeNotes: vi.fn(),
    subtotalUsdText: '2.00',
    tipAmountBs: 0,
    totalUsdText: '2.00',
    totalBs: 100,
    isSaving: false,
    onSubmit: vi.fn(),
    tipEnabled: false,
    tipAmount: '',
    tipPaymentMethod: 'efectivo',
    tipNotes: '',
    onToggleTip: vi.fn(),
    onChangeTipAmount: vi.fn(),
    onChangeTipPaymentMethod: vi.fn(),
    onChangeTipNotes: vi.fn(),
  }),
}));

vi.mock('../hooks/useEditRentalSheetViewModel', () => ({
  useEditRentalSheetViewModel: () => ({
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
    selectedMachineId: '',
    onSelectMachine: vi.fn(),
    shiftOptions: [],
    selectedShift: 'completo',
    onSelectShift: vi.fn(),
    paymentMethodOptions: paymentOptions,
    selectedPaymentMethod: 'efectivo',
    onSelectPaymentMethod: vi.fn(),
    split1Amount: '60',
    split2Method: 'pago_movil',
    split2AmountText: 'Bs 60.00',
    onChangeSplit1Amount: vi.fn(),
    onSelectSplit2Method: vi.fn(),
    isMixedPaymentEnabled: true,
    isMixedPayment: isEditMixedPaymentActive,
    onToggleMixedPayment: toggleEditMixedPaymentMock,
    deliveryTime: '09:00',
    timeSlots: [],
    pickupLabel: 'Hoy 1:00 PM',
    onSelectDeliveryTime: vi.fn(),
    deliveryFeeOptions: [0],
    deliveryFee: 0,
    onSelectDeliveryFee: vi.fn(),
    customers: [],
    selectedCustomerId: null,
    customerName: '',
    customerPhone: '',
    customerAddress: '',
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
  }),
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

describe('Rentals mixed payment activation UI', () => {
  beforeEach(() => {
    isCreateMixedPaymentActive = false;
    isEditMixedPaymentActive = false;
    toggleCreateMixedPaymentMock.mockReset();
    toggleEditMixedPaymentMock.mockReset();
  });

  it('shows create mixed-payment fields only after activation button press', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <RentalSheet open={true} onOpenChange={vi.fn()} />
    );

    expect(
      screen.queryByPlaceholderText('Monto método secundario (Bs)')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Monto método secundario: Bs 70.00')
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /pago mixto/i }));
    expect(toggleCreateMixedPaymentMock).toHaveBeenCalledTimes(1);

    isCreateMixedPaymentActive = true;
    rerender(<RentalSheet open={true} onOpenChange={vi.fn()} />);

    expect(screen.getByText(/Dividir cobro/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Monto método secundario/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Monto método secundario:/i)
    ).toBeInTheDocument();
  });

  it('shows edit mixed-payment fields only after activation button press', async () => {
    const user = userEvent.setup();
    const rental: WasherRental = {
      id: 'rental-1',
      date: '2026-03-07',
      customerId: 'customer-1',
      customerName: 'Cliente',
      customerPhone: '0414',
      customerAddress: 'Dirección',
      machineId: 'machine-1',
      shift: 'medio',
      deliveryTime: '09:00',
      pickupTime: '13:00',
      pickupDate: '2026-03-07',
      deliveryFee: 0,
      totalUsd: 2,
      paymentMethod: 'efectivo',
      status: 'agendado',
      isPaid: false,
      createdAt: '2026-03-07T12:00:00.000Z',
      updatedAt: '2026-03-07T12:00:00.000Z',
    };

    const { rerender } = render(
      <EditRentalSheet rental={rental} open={true} onOpenChange={vi.fn()} />
    );

    expect(
      screen.queryByPlaceholderText('Monto método secundario (Bs)')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Monto método secundario: Bs 60\.00/i)
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /pago mixto/i }));
    expect(toggleEditMixedPaymentMock).toHaveBeenCalledTimes(1);

    isEditMixedPaymentActive = true;
    rerender(
      <EditRentalSheet rental={rental} open={true} onOpenChange={vi.fn()} />
    );

    expect(screen.getByText(/Dividir cobro/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Monto método secundario/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText('Monto método secundario: Bs 60.00')
    ).toBeInTheDocument();
  });
});

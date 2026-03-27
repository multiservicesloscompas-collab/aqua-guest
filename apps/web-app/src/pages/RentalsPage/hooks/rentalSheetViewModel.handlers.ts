import type { PaymentMethod } from '@/types';

interface CustomerRef {
  id: string;
  name: string;
  phone: string;
  address: string;
}

interface TipToggleParams {
  setTipEnabled: (updater: (value: boolean) => boolean) => void;
  setTipPaymentMethod: (value: PaymentMethod) => void;
  paymentMethod: PaymentMethod;
}

export function handleRentalCustomerSelect(params: {
  customerId: string | null;
  customers: CustomerRef[];
  setSelectedCustomerId: (value: string) => void;
  setCustomerName: (value: string) => void;
  setCustomerPhone: (value: string) => void;
  setCustomerAddress: (value: string) => void;
}) {
  if (!params.customerId) {
    params.setSelectedCustomerId('');
    params.setCustomerName('');
    params.setCustomerPhone('');
    params.setCustomerAddress('');
    return;
  }

  const customer = params.customers.find(
    (item) => item.id === params.customerId
  );
  if (!customer) return;

  params.setSelectedCustomerId(customer.id);
  params.setCustomerName(customer.name);
  params.setCustomerPhone(customer.phone);
  params.setCustomerAddress(customer.address);
}

export function handleCreateNewRentalCustomer(params: {
  setSelectedCustomerId: (value: string) => void;
  setCustomerName: (value: string) => void;
  setCustomerPhone: (value: string) => void;
  setCustomerAddress: (value: string) => void;
}) {
  params.setSelectedCustomerId('');
  params.setCustomerName('');
  params.setCustomerPhone('');
  params.setCustomerAddress('');

  setTimeout(() => {
    const nameInput = document.querySelector(
      'input[placeholder="Nombre del cliente"]'
    ) as HTMLInputElement | null;
    nameInput?.focus();
  }, 0);
}

export function toggleRentalMixedPayment(params: {
  setIsMixedPayment: (updater: (current: boolean) => boolean) => void;
  setSplit1Amount: (value: string) => void;
}) {
  params.setIsMixedPayment((current) => {
    const next = !current;
    if (!next) {
      params.setSplit1Amount('');
    }
    return next;
  });
}

export function toggleRentalTipCapture(params: TipToggleParams) {
  params.setTipEnabled((value) => {
    const next = !value;
    if (next) {
      params.setTipPaymentMethod(params.paymentMethod);
    }
    return next;
  });
}

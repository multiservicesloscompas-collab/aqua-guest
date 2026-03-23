import { PaymentMethod } from '@/types';
import { SaleMixedPaymentFields } from '@/components/ventas/SaleMixedPaymentFields';

interface RentalMixedPaymentFieldsProps {
  amount: string;
  secondaryMethod: PaymentMethod;
  selectedPaymentMethod: PaymentMethod;
  onAmountChange: (value: string) => void;
  onSecondaryMethodChange: (value: PaymentMethod) => void;
  totalBs: number;
}

export function RentalMixedPaymentFields({
  amount,
  secondaryMethod,
  selectedPaymentMethod,
  onAmountChange,
  onSecondaryMethodChange,
  totalBs,
}: RentalMixedPaymentFieldsProps) {
  return (
    <SaleMixedPaymentFields
      primaryMethod={selectedPaymentMethod}
      secondaryMethod={secondaryMethod}
      amountInput={amount}
      totalBs={totalBs}
      variant="select"
      amountInputMode="secondary"
      onAmountInputChange={onAmountChange}
      onSecondaryMethodChange={onSecondaryMethodChange}
    />
  );
}

import {
  Loader2,
  Pencil,
  Plus,
  Banknote,
  CreditCard,
  DollarSign,
  Smartphone,
  type LucideIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  ExpenseCategory,
  ExpenseCategoryLabels,
  PaymentMethod,
  PaymentMethodLabels,
} from '@/types';
import { MixedPaymentCard } from '@/components/payments/MixedPaymentCard';
import { cn } from '@/lib/utils';

interface ExpenseSheetFormProps {
  description: string;
  amount: string;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  notes: string;
  editing: boolean;
  isSaving: boolean;
  // Mixed payment props
  isMixedPayment: boolean;
  secondaryMethod: PaymentMethod;
  mixedAmountInput: string;
  enableMixedPaymentFeature?: boolean;
  onIsMixedPaymentChange: (value: boolean) => void;
  onSecondaryMethodChange: (value: PaymentMethod) => void;
  onMixedAmountInputChange: (value: string) => void;
  // Existing handlers
  onDescriptionChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onCategoryChange: (value: ExpenseCategory) => void;
  onPaymentMethodChange: (value: PaymentMethod) => void;
  onNotesChange: (value: string) => void;
  onSubmit: () => void;
}

const methodIcons: Record<PaymentMethod, LucideIcon> = {
  pago_movil: Smartphone,
  efectivo: Banknote,
  punto_venta: CreditCard,
  divisa: DollarSign,
};

const paymentMethods: PaymentMethod[] = [
  'pago_movil',
  'efectivo',
  'punto_venta',
  'divisa',
];

export function ExpenseSheetForm({
  description,
  amount,
  category,
  paymentMethod,
  notes,
  editing,
  isSaving,
  isMixedPayment,
  secondaryMethod,
  mixedAmountInput,
  enableMixedPaymentFeature = true,
  onIsMixedPaymentChange,
  onSecondaryMethodChange,
  onMixedAmountInputChange,
  onDescriptionChange,
  onAmountChange,
  onCategoryChange,
  onPaymentMethodChange,
  onNotesChange,
  onSubmit,
}: ExpenseSheetFormProps) {
  const totalBs = Number(amount) || 0;

  return (
    <div className="space-y-4">
      {/* 1. Monto */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Monto (Bs)</Label>
        <Input
          type="number"
          step="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          className="h-12 text-lg font-semibold border-border/60"
        />
      </div>

      {/* 2. Descripción */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Descripción</Label>
        <Input
          placeholder="Ej: Compra de insumos"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="h-12"
        />
      </div>

      {/* 3. Método de Pago (Botones Grid) */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">
          {isMixedPayment ? 'Método Principal' : 'Método de Pago'}
        </Label>
        <div className="grid grid-cols-4 gap-2">
          {paymentMethods.map((method) => {
            const Icon = methodIcons[method];
            return (
              <button
                key={method}
                type="button"
                onClick={() => onPaymentMethodChange(method)}
                aria-label={`Método de pago ${PaymentMethodLabels[method]}`}
                aria-pressed={paymentMethod === method}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 h-16 rounded-xl border-2 transition-all',
                  paymentMethod === method
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card hover:border-primary/50'
                )}
              >
                <Icon
                  className={cn(
                    'w-5 h-5',
                    paymentMethod === method
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  )}
                />
                <span
                  className={cn(
                    'text-[10px] font-medium',
                    paymentMethod === method
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  )}
                >
                  {PaymentMethodLabels[method]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Categoría */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Categoría</Label>
        <Select
          value={category}
          onValueChange={(v) => onCategoryChange(v as ExpenseCategory)}
        >
          <SelectTrigger className="h-12">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(ExpenseCategoryLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 5. Pago Mixto */}
      {enableMixedPaymentFeature && (
        <MixedPaymentCard
          isMixedPayment={isMixedPayment}
          onToggle={() => onIsMixedPaymentChange(!isMixedPayment)}
          primaryMethod={paymentMethod}
          secondaryMethod={secondaryMethod}
          amountInput={mixedAmountInput}
          totalBs={totalBs}
          variant="grid"
          amountInputMode="secondary"
          onAmountInputChange={onMixedAmountInputChange}
          onSecondaryMethodChange={onSecondaryMethodChange}
        />
      )}

      {/* 6. Notas */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Notas (opcional)</Label>
        <Textarea
          placeholder="Detalles adicionales..."
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          className="h-16 resize-none"
        />
      </div>

      {/* Botón de Submit */}
      <Button
        onClick={onSubmit}
        disabled={!description || !amount || isSaving}
        className="w-full h-14 text-base font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl mt-4"
      >
        {isSaving ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Guardando...
          </>
        ) : editing ? (
          <>
            <Pencil className="w-5 h-5 mr-2" />
            Guardar Cambios
          </>
        ) : (
          <>
            <Plus className="w-5 h-5 mr-2" />
            Registrar Egreso
          </>
        )}
      </Button>
    </div>
  );
}

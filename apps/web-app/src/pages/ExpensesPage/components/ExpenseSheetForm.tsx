import { Loader2, Pencil, Plus } from 'lucide-react';

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

interface ExpenseSheetFormProps {
  description: string;
  amount: string;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  notes: string;
  editing: boolean;
  isSaving: boolean;
  onDescriptionChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onCategoryChange: (value: ExpenseCategory) => void;
  onPaymentMethodChange: (value: PaymentMethod) => void;
  onNotesChange: (value: string) => void;
  onSubmit: () => void;
}

export function ExpenseSheetForm({
  description,
  amount,
  category,
  paymentMethod,
  notes,
  editing,
  isSaving,
  onDescriptionChange,
  onAmountChange,
  onCategoryChange,
  onPaymentMethodChange,
  onNotesChange,
  onSubmit,
}: ExpenseSheetFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Descripción</Label>
        <Input
          placeholder="Ej: Compra de insumos"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="h-12"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">Monto (Bs)</Label>
        <Input
          type="number"
          step="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          className="h-12 text-lg font-semibold"
        />
      </div>

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

      <div className="space-y-2">
        <Label className="text-sm font-semibold">Método de Pago</Label>
        <Select
          value={paymentMethod}
          onValueChange={(v) => onPaymentMethodChange(v as PaymentMethod)}
        >
          <SelectTrigger className="h-12">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="efectivo">
              {PaymentMethodLabels.efectivo}
            </SelectItem>
            <SelectItem value="pago_movil">
              {PaymentMethodLabels.pago_movil}
            </SelectItem>
            <SelectItem value="divisa">{PaymentMethodLabels.divisa}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">Notas (opcional)</Label>
        <Textarea
          placeholder="Detalles adicionales..."
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          className="h-16 resize-none"
        />
      </div>

      <Button
        onClick={onSubmit}
        disabled={!description || !amount || isSaving}
        className="w-full h-14 text-base font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
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

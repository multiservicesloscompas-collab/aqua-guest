import { Loader2, Plus, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { PaymentMethod, PaymentMethodLabels } from '@/types';
import { PaymentBalanceFormData } from '../hooks/usePaymentBalancePageViewModel';

interface PaymentBalanceFormCardProps {
  formData: PaymentBalanceFormData;
  editingTransaction: string | null;
  exchangeRate: number;
  isAdding: boolean;
  isUpdating: boolean;
  onFormDataChange: (
    updater: (prev: PaymentBalanceFormData) => PaymentBalanceFormData
  ) => void;
  onAdd: () => void;
  onUpdate: (id: string) => void;
  onCancelEdit: () => void;
  getMethodIcon: (method: PaymentMethod) => string;
}

export function PaymentBalanceFormCard({
  formData,
  editingTransaction,
  exchangeRate,
  isAdding,
  isUpdating,
  onFormDataChange,
  onAdd,
  onUpdate,
  onCancelEdit,
  getMethodIcon,
}: PaymentBalanceFormCardProps) {
  const isAvance = formData.operationType === 'avance';
  const isOutDivisa = formData.fromMethod === 'divisa';
  const isInDivisa = formData.toMethod === 'divisa';

  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="text-lg font-semibold mb-4">
          {editingTransaction ? 'Editar Transferencia' : 'Nueva Transferencia'}
        </h3>

        <div className="space-y-4">
          <div>
            <Label id="operationType-label">Tipo de operación</Label>
            <Tabs
              value={formData.operationType}
              onValueChange={(value) =>
                onFormDataChange((prev) => {
                  const operationType = value as 'equilibrio' | 'avance';
                  return {
                    ...prev,
                    operationType,
                    amountIn:
                      operationType === 'equilibrio'
                        ? prev.amountOut
                        : prev.amountIn,
                  };
                })
              }
              className="mt-2"
            >
              <TabsList
                aria-labelledby="operationType-label"
                className="grid w-full grid-cols-2 h-11 rounded-lg bg-muted p-1"
              >
                <TabsTrigger value="equilibrio">Equilibrio</TabsTrigger>
                <TabsTrigger value="avance">Avance</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div>
            <Label htmlFor="fromMethod">Desde</Label>
            <Select
              value={formData.fromMethod}
              onValueChange={(value) =>
                onFormDataChange((prev) => ({
                  ...prev,
                  fromMethod: value as PaymentMethod,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar método de origen" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PaymentMethodLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    <span className="flex items-center gap-2">
                      <span>{getMethodIcon(value as PaymentMethod)}</span>
                      {label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="toMethod">Hacia</Label>
            <Select
              value={formData.toMethod}
              onValueChange={(value) =>
                onFormDataChange((prev) => ({
                  ...prev,
                  toMethod: value as PaymentMethod,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar método de destino" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PaymentMethodLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    <span className="flex items-center gap-2">
                      <span>{getMethodIcon(value as PaymentMethod)}</span>
                      {label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="amountOut">
              Monto salida ({isOutDivisa ? 'USD' : 'Bs'})
            </Label>
            <Input
              id="amountOut"
              type="number"
              step="0.01"
              min="0.01"
              placeholder={isOutDivisa ? '0.00 USD' : '0.00 Bs'}
              value={formData.amountOut}
              onChange={(event) =>
                onFormDataChange((prev) => ({
                  ...prev,
                  amountOut: event.target.value,
                  amountIn:
                    prev.operationType === 'equilibrio'
                      ? event.target.value
                      : prev.amountIn,
                }))
              }
            />
            {isOutDivisa && (
              <p className="text-xs text-muted-foreground mt-1">
                1 USD = {exchangeRate.toFixed(2)} Bs
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="amountIn">
              Monto entrada ({isInDivisa ? 'USD' : 'Bs'})
            </Label>
            <Input
              id="amountIn"
              type="number"
              step="0.01"
              min="0.01"
              placeholder={isInDivisa ? '0.00 USD' : '0.00 Bs'}
              value={isAvance ? formData.amountIn : formData.amountOut}
              disabled={!isAvance}
              onChange={(event) =>
                onFormDataChange((prev) => ({
                  ...prev,
                  amountIn: event.target.value,
                }))
              }
            />
            {!isAvance && (
              <p className="text-xs text-muted-foreground mt-1">
                En equilibrio, salida y entrada usan el mismo monto.
              </p>
            )}
            {isInDivisa && (
              <p className="text-xs text-muted-foreground mt-1">
                1 USD = {exchangeRate.toFixed(2)} Bs
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Notas sobre esta transferencia..."
              value={formData.notes}
              onChange={(event) =>
                onFormDataChange((prev) => ({
                  ...prev,
                  notes: event.target.value,
                }))
              }
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            {editingTransaction ? (
              <>
                <Button
                  onClick={() => onUpdate(editingTransaction)}
                  disabled={isUpdating}
                  className="flex-1"
                >
                  {isUpdating ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {isUpdating ? 'Actualizando...' : 'Actualizar'}
                </Button>
                <Button
                  onClick={onCancelEdit}
                  variant="outline"
                  disabled={isUpdating}
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button onClick={onAdd} disabled={isAdding} className="w-full">
                {isAdding ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                {isAdding ? 'Agregando...' : 'Agregar Operación'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

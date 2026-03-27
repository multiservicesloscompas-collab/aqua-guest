import { Loader2, Pencil } from 'lucide-react';
import { TipCaptureCard } from '@/components/tips/TipCaptureCard';
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { PaymentMethod, PaymentMethodLabels, Sale } from '@/types';
import { useConfigStore } from '@/store/useConfigStore';
import { CartTotalsSummary } from './CartTotalsSummary';
import { EditSaleItemsEditor } from './EditSaleItemsEditor';
import { MixedPaymentCard } from '../payments/MixedPaymentCard';
import { useEditSaleSheetViewModel } from './useEditSaleSheetViewModel';

interface EditSaleSheetProps {
  sale: Sale | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditSaleSheet({
  sale,
  open,
  onOpenChange,
}: EditSaleSheetProps) {
  const config = useConfigStore((state) => state.config);
  const viewModel = useEditSaleSheetViewModel({ sale, open, onOpenChange });

  if (!sale) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        tabletSide="right"
        tabletClassName="sm:max-w-[440px]"
        className="h-[90vh] sm:h-full flex flex-col rounded-t-2xl px-4 pb-8 sm:rounded-none overflow-y-auto overscroll-contain touch-pan-y"
      >
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <Pencil className="w-5 h-5 text-primary" />
            Editar Venta #{sale.dailyNumber}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Subtotal (Bs)</Label>
            <Input
              type="number"
              step="0.01"
              value={viewModel.subtotalBs}
              onChange={(e) => viewModel.setSubtotalBs(e.target.value)}
              className="h-12 text-lg font-semibold"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Metodo de Pago</Label>
            <Select
              value={viewModel.paymentMethod}
              onValueChange={(value) =>
                viewModel.setPaymentMethod(value as PaymentMethod)
              }
            >
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PaymentMethodLabels).map(([method, label]) => (
                  <SelectItem key={method} value={method}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <TipCaptureCard
            enabled={viewModel.tipEnabled}
            amount={viewModel.tipAmount}
            paymentMethod={viewModel.tipPaymentMethod}
            notes={viewModel.tipNotes}
            onToggle={() => {
              viewModel.setTipEnabled((current) => {
                const next = !current;
                if (next) {
                  viewModel.setTipPaymentMethod(viewModel.paymentMethod);
                }
                return next;
              });
            }}
            onAmountChange={viewModel.setTipAmount}
            onPaymentMethodChange={viewModel.setTipPaymentMethod}
            onNotesChange={viewModel.setTipNotes}
          />

          {viewModel.isMixedPaymentEnabled && (
            <MixedPaymentCard
              isMixedPayment={viewModel.isMixedPayment}
              onToggle={() => {
                const enabled = !viewModel.isMixedPayment;
                viewModel.setIsMixedPayment(enabled);
                if (!enabled) {
                  viewModel.setSplit1Amount('');
                }
              }}
              primaryMethod={viewModel.paymentMethod}
              secondaryMethod={viewModel.split2Method}
              amountInput={viewModel.split1Amount}
              totalBs={viewModel.finalTotals.totalBs}
              variant="grid"
              amountInputMode="secondary"
              onAmountInputChange={viewModel.setSplit1Amount}
              onSecondaryMethodChange={viewModel.setSplit2Method}
            />
          )}

          <EditSaleItemsEditor
            items={viewModel.items}
            onQuantityChange={viewModel.onQuantityChange}
          />

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Notas (opcional)</Label>
            <Textarea
              placeholder="Observaciones..."
              value={viewModel.notes}
              onChange={(e) => viewModel.setNotes(e.target.value)}
              className="h-20 resize-none"
            />
          </div>

          <CartTotalsSummary
            subtotalBs={Number(viewModel.subtotalBs) || 0}
            tipAmountBs={viewModel.tipAmountBs}
            totalBs={viewModel.finalTotals.totalBs}
            totalUsd={viewModel.finalTotals.totalUsd}
          />

          <Button
            onClick={viewModel.onSubmit}
            disabled={viewModel.isSaving || config.exchangeRate <= 0}
            className="w-full h-12 text-base font-bold"
          >
            {viewModel.isSaving && (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            )}
            {viewModel.isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

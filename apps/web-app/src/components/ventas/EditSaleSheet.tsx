import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sale, PaymentMethod, PaymentMethodLabels } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';

interface EditSaleSheetProps {
  sale: Sale | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditSaleSheet({ sale, open, onOpenChange }: EditSaleSheetProps) {
  const { updateSale, config } = useAppStore();
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pago_movil');
  const [notes, setNotes] = useState('');
  const [totalBs, setTotalBs] = useState('');

  useEffect(() => {
    if (sale) {
      setPaymentMethod(sale.paymentMethod);
      setNotes(sale.notes || '');
      setTotalBs(sale.totalBs.toString());
    }
  }, [sale]);

  const handleSubmit = () => {
    if (!sale) return;
    
    const newTotalBs = parseFloat(totalBs);
    if (isNaN(newTotalBs) || newTotalBs <= 0) {
      toast.error('Monto inválido');
      return;
    }

    updateSale(sale.id, {
      paymentMethod,
      notes: notes.trim() || undefined,
      totalBs: newTotalBs,
      totalUsd: newTotalBs / config.exchangeRate,
    });

    toast.success('Venta actualizada');
    onOpenChange(false);
  };

  if (!sale) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto rounded-t-2xl px-4 pb-8">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <Pencil className="w-5 h-5 text-primary" />
            Editar Venta #{sale.dailyNumber}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Total (Bs)</Label>
            <Input
              type="number"
              step="0.01"
              value={totalBs}
              onChange={(e) => setTotalBs(e.target.value)}
              className="h-12 text-lg font-semibold"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Método de Pago</Label>
            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PaymentMethodLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Notas (opcional)</Label>
            <Textarea
              placeholder="Observaciones..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-20 resize-none"
            />
          </div>

          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm text-muted-foreground">
              <strong>Items:</strong> {sale.items.map(i => `${i.quantity}x ${i.productName}${i.liters ? ` (${i.liters}L)` : ''}`).join(', ')}
            </p>
          </div>

          <Button onClick={handleSubmit} className="w-full h-12 text-base font-bold">
            Guardar Cambios
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

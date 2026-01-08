import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { useAppStore } from '@/store/useAppStore';
import { PaymentMethod, PaymentMethodLabels, PaymentBalanceTransaction } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeftRight, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { DateSelector } from '@/components/ventas/DateSelector';
import { toast } from 'sonner';

export function PaymentBalancePage() {
  const { 
    paymentBalanceTransactions, 
    addPaymentBalanceTransaction, 
    updatePaymentBalanceTransaction, 
    deletePaymentBalanceTransaction,
    getPaymentBalanceSummary,
    selectedDate,
    setSelectedDate,
    config
  } = useAppStore();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fromMethod: '' as PaymentMethod,
    toMethod: '' as PaymentMethod,
    amount: '',
    notes: ''
  });

  const balanceSummary = useMemo(() => {
    return getPaymentBalanceSummary(selectedDate);
  }, [selectedDate, getPaymentBalanceSummary, paymentBalanceTransactions]);

  const transactionsForDate = useMemo(() => {
    return paymentBalanceTransactions
      .filter(t => t.date === selectedDate)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [paymentBalanceTransactions, selectedDate]);

  const handleAddTransaction = async () => {
    if (!formData.fromMethod || !formData.toMethod || !formData.amount) {
      toast.error('Completa todos los campos requeridos');
      return;
    }

    if (formData.fromMethod === formData.toMethod) {
      toast.error('Los métodos de pago origen y destino deben ser diferentes');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('El monto debe ser un número positivo');
      return;
    }

    // Obtener tasa de cambio actual
    const exchangeRate = config.exchangeRate;
    
    // Calcular montos según los métodos de pago involucrados
    let amountBs = amount;
    let amountUsd = 0;
    
    if (formData.fromMethod === 'divisa' || formData.toMethod === 'divisa') {
      // Si involucra divisas, el monto ingresado se considera en USD
      amountUsd = amount;
      amountBs = amount * exchangeRate;
    }

    try {
      await addPaymentBalanceTransaction({
        date: selectedDate,
        fromMethod: formData.fromMethod,
        toMethod: formData.toMethod,
        amount: amountBs, // Mantener compatibilidad
        amountBs,
        amountUsd: amountUsd || undefined,
        notes: formData.notes
      });

      // Reset form
      setFormData({
        fromMethod: '',
        toMethod: '',
        amount: '',
        notes: ''
      });
      setShowAddForm(false);
      
      toast.success('Transferencia registrada exitosamente');
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error('No se pudo registrar la transferencia. Intenta nuevamente.');
    }
  };

  const handleUpdateTransaction = async (id: string) => {
    if (!formData.fromMethod || !formData.toMethod || !formData.amount) {
      toast.error('Completa todos los campos requeridos');
      return;
    }

    if (formData.fromMethod === formData.toMethod) {
      toast.error('Los métodos de pago origen y destino deben ser diferentes');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('El monto debe ser un número positivo');
      return;
    }

    // Obtener tasa de cambio actual
    const exchangeRate = config.exchangeRate;
    
    // Calcular montos según los métodos de pago involucrados
    let amountBs = amount;
    let amountUsd = 0;
    
    if (formData.fromMethod === 'divisa' || formData.toMethod === 'divisa') {
      // Si involucra divisas, el monto ingresado se considera en USD
      amountUsd = amount;
      amountBs = amount * exchangeRate;
    }

    try {
      await updatePaymentBalanceTransaction(id, {
        fromMethod: formData.fromMethod,
        toMethod: formData.toMethod,
        amount: amountBs, // Mantener compatibilidad
        amountBs,
        amountUsd: amountUsd || undefined,
        notes: formData.notes
      });

      // Reset form
      setFormData({
        fromMethod: '',
        toMethod: '',
        amount: '',
        notes: ''
      });
      setEditingTransaction(null);
      
      toast.success('Transferencia actualizada exitosamente');
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast.error('No se pudo actualizar la transferencia. Intenta nuevamente.');
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (confirm('¿Está seguro de eliminar esta transacción de equilibrio?')) {
      try {
        await deletePaymentBalanceTransaction(id);
        toast.success('Transferencia eliminada exitosamente');
      } catch (error) {
        console.error('Error deleting transaction:', error);
        toast.error('No se pudo eliminar la transferencia. Intenta nuevamente.');
      }
    }
  };

  const startEdit = (transaction: PaymentBalanceTransaction) => {
    setEditingTransaction(transaction.id);
    
    // Determinar el monto a mostrar en el formulario
    let displayAmount = transaction.amount;
    if (transaction.amountUsd) {
      // Si la transacción tiene monto en USD, mostrar ese valor
      displayAmount = transaction.amountUsd;
    }
    
    setFormData({
      fromMethod: transaction.fromMethod,
      toMethod: transaction.toMethod,
      amount: displayAmount.toString(),
      notes: transaction.notes || ''
    });
  };

  const cancelEdit = () => {
    setEditingTransaction(null);
    setFormData({
      fromMethod: '',
      toMethod: '',
      amount: '',
      notes: ''
    });
  };

  const getMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'efectivo':
        return '💵';
      case 'pago_movil':
        return '📱';
      case 'punto_venta':
        return '💳';
      case 'divisa':
        return '💲';
      default:
        return '💰';
    }
  };

  const getMethodColor = (method: PaymentMethod) => {
    switch (method) {
      case 'efectivo':
        return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'pago_movil':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'punto_venta':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'divisa':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <Header title="Equilibrio de Pagos" subtitle="Transferencia entre métodos de pago" />

      <main className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
        {/* Selector de fecha */}
        <DateSelector
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />

        {/* Resumen de balances */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-5">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-primary" />
              Resumen de Balances ({selectedDate})
            </h3>
            
            <div className="space-y-3">
              {balanceSummary.map((summary) => (
                <div key={summary.method} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getMethodIcon(summary.method)}</span>
                    <div>
                      <p className="font-medium">{PaymentMethodLabels[summary.method]}</p>
                      <p className="text-xs text-muted-foreground">
                        Original: {summary.method === 'divisa' 
                          ? `$${(summary.originalTotal / config.exchangeRate).toFixed(2)}`
                          : `Bs ${summary.originalTotal.toFixed(2)}`
                        }
                      </p>
                      {summary.adjustments !== 0 && (
                        <p className="text-xs">
                          <span className={summary.adjustments > 0 ? 'text-green-600' : 'text-red-600'}>
                            Ajuste: {summary.adjustments > 0 ? '+' : ''}{summary.method === 'divisa' 
                              ? `$${(summary.adjustments / config.exchangeRate).toFixed(2)}`
                              : `Bs ${summary.adjustments.toFixed(2)}`
                            }
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">
                      {summary.method === 'divisa' 
                        ? `$${(summary.finalTotal / config.exchangeRate).toFixed(2)}`
                        : `Bs ${summary.finalTotal.toFixed(2)}`
                      }
                    </p>
                    <Badge 
                      variant="outline" 
                      className={getMethodColor(summary.method)}
                    >
                      {summary.method === 'divisa' ? 'USD' : 'Bs'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Botón para agregar transacción */}
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-full"
          variant={showAddForm ? "outline" : "default"}
        >
          <Plus className="w-4 h-4 mr-2" />
          {showAddForm ? 'Cancelar' : 'Nueva Transferencia'}
        </Button>

        {/* Formulario para agregar/editar transacción */}
        {(showAddForm || editingTransaction) && (
          <Card>
            <CardContent className="p-5">
              <h3 className="text-lg font-semibold mb-4">
                {editingTransaction ? 'Editar Transferencia' : 'Nueva Transferencia'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fromMethod">Desde</Label>
                  <Select
                    value={formData.fromMethod}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, fromMethod: value as PaymentMethod }))}
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
                    onValueChange={(value) => setFormData(prev => ({ ...prev, toMethod: value as PaymentMethod }))}
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
                  <Label htmlFor="amount">
                    {formData.fromMethod === 'divisa' || formData.toMethod === 'divisa' 
                      ? 'Monto (USD)' 
                      : 'Monto (Bs)'}
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder={formData.fromMethod === 'divisa' || formData.toMethod === 'divisa' ? '0.00 USD' : '0.00 Bs'}
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  />
                  {(formData.fromMethod === 'divisa' || formData.toMethod === 'divisa') && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.fromMethod === 'divisa' && formData.toMethod === 'divisa' 
                        ? 'Transferencia entre divisas'
                        : `1 USD = ${config.exchangeRate.toFixed(2)} Bs`
                      }
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="notes">Notas (opcional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Notas sobre esta transferencia..."
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  {editingTransaction ? (
                    <>
                      <Button onClick={() => handleUpdateTransaction(editingTransaction)} className="flex-1">
                        <Save className="w-4 h-4 mr-2" />
                        Actualizar
                      </Button>
                      <Button onClick={cancelEdit} variant="outline">
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <Button onClick={handleAddTransaction} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Transferencia
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de transacciones del día */}
        <Card>
          <CardContent className="p-5">
            <h3 className="text-lg font-semibold mb-4">Transferencias del día</h3>
            
            {transactionsForDate.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No hay transferencias para este día
              </p>
            ) : (
              <div className="space-y-3">
                {transactionsForDate.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <span className="text-lg">{getMethodIcon(transaction.fromMethod)}</span>
                        <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
                        <span className="text-lg">{getMethodIcon(transaction.toMethod)}</span>
                      </div>
                      <div>
                        <p className="font-medium">
                          {PaymentMethodLabels[transaction.fromMethod]} → {PaymentMethodLabels[transaction.toMethod]}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {transaction.amountUsd 
                            ? `$${transaction.amountUsd.toFixed(2)}`
                            : `Bs ${transaction.amount.toFixed(2)}`
                          }
                        </p>
                        {transaction.notes && (
                          <p className="text-xs text-muted-foreground">{transaction.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEdit(transaction)}
                        disabled={editingTransaction !== null}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteTransaction(transaction.id)}
                        disabled={editingTransaction !== null}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

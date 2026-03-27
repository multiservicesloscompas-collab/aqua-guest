import {
  CircleCheckBig,
  CreditCard,
  FilePenLine,
  HandCoins,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PaymentMethodLabels, type PaymentMethod } from '@/types';
import type { Tip } from '@/types/tips';

import { formatBolivars } from '../utils';

interface TipCardProps {
  tip: Tip;
  originLabel: string;
  isEditing: boolean;
  noteDraft: string;
  savingNote: boolean;
  isPaying: boolean;
  onStartEditing: (tipId: string, currentNote?: string) => void;
  onNoteChange: (value: string) => void;
  onSaveNote: () => void;
  onCancelEditing: () => void;
  onPayTip: (tipId: string) => void;
}

function getMethodLabel(method: PaymentMethod) {
  return PaymentMethodLabels[method] ?? method;
}

export function TipCard({
  tip,
  originLabel,
  isEditing,
  noteDraft,
  savingNote,
  isPaying,
  onStartEditing,
  onNoteChange,
  onSaveNote,
  onCancelEditing,
  onPayTip,
}: TipCardProps) {
  const isPending = tip.status === 'pending';

  return (
    <article
      className="space-y-3 rounded-2xl border border-border/80 bg-card p-4 shadow-card"
      data-testid={`tip-card-${tip.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold text-foreground">
            {tip.originType === 'sale'
              ? 'Propina por Venta de Agua'
              : 'Propina de Alquiler de Lavadora'}
          </p>
          <p className="text-xs text-muted-foreground break-words">
            {originLabel}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Monto
          </p>
          <p className="text-lg font-semibold text-foreground [font-variant-numeric:tabular-nums]">
            Bs {formatBolivars(tip.amountBs)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant={isPending ? 'outline' : 'secondary'}
          data-testid={`tip-status-badge-${tip.id}`}
          className={
            isPending
              ? 'border-amber-400 text-amber-700'
              : 'bg-emerald-100 text-emerald-700'
          }
        >
          {isPending ? 'Pendiente' : 'Pagada'}
        </Badge>
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          <CreditCard className="h-3.5 w-3.5" aria-hidden="true" />
          <span data-testid={`tip-capture-method-${tip.id}`}>
            {getMethodLabel(tip.capturePaymentMethod)}
          </span>
        </span>
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <label htmlFor={`tip-note-${tip.id}`} className="sr-only">
            Nota de propina
          </label>
          <Textarea
            id={`tip-note-${tip.id}`}
            aria-label="Nota de propina"
            value={noteDraft}
            onChange={(event) => onNoteChange(event.target.value)}
            rows={3}
            name={`tip-note-${tip.id}`}
            autoComplete="off"
            placeholder="Agregar contexto de esta propina…"
          />
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              size="sm"
              className="h-10 touch-manipulation"
              onClick={onSaveNote}
              disabled={savingNote}
            >
              Guardar Nota
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-10 touch-manipulation"
              onClick={onCancelEditing}
              disabled={savingNote}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 rounded-xl bg-muted/40 p-3">
          <p className="text-xs leading-relaxed text-muted-foreground break-words">
            {tip.notes ? tip.notes : 'Sin nota registrada'}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-10 touch-manipulation"
              onClick={() => onStartEditing(tip.id, tip.notes)}
            >
              <FilePenLine className="h-4 w-4" aria-hidden="true" />
              Editar Nota
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-10 touch-manipulation"
              onClick={() => onPayTip(tip.id)}
              data-testid={`tip-pay-button-${tip.id}`}
              disabled={!isPending || isPaying}
              variant={isPending ? 'default' : 'secondary'}
            >
              {isPending ? (
                <>
                  <HandCoins className="h-4 w-4" aria-hidden="true" />
                  {isPaying ? 'Pagando…' : 'Pagar'}
                </>
              ) : (
                <>
                  <CircleCheckBig className="h-4 w-4" aria-hidden="true" />
                  Pagada
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}

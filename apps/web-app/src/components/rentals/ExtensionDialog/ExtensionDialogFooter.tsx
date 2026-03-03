import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExtensionDialogFooterProps {
  isSubmitting: boolean;
  isSubmitDisabled: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

export function ExtensionDialogFooter({
  isSubmitting,
  isSubmitDisabled,
  onCancel,
  onSubmit,
}: ExtensionDialogFooterProps) {
  return (
    <div className="flex-shrink-0 pt-4 flex justify-end gap-2">
      <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
        Cancelar
      </Button>
      <Button onClick={onSubmit} disabled={isSubmitDisabled}>
        {isSubmitting ? (
          'Aplicando...'
        ) : (
          <>
            <Plus className="w-4 h-4 mr-2" />
            Aplicar Extensión
          </>
        )}
      </Button>
    </div>
  );
}

import { Clock } from 'lucide-react';
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ExtensionDialogHeaderProps {
  customerName: string;
}

export function ExtensionDialogHeader({
  customerName,
}: ExtensionDialogHeaderProps) {
  return (
    <DialogHeader className="flex-shrink-0">
      <DialogTitle className="flex items-center gap-2">
        <Clock className="w-5 h-5" />
        Extender Tiempo de Alquiler
      </DialogTitle>
      <DialogDescription>
        Agregar tiempo adicional al alquiler de {customerName}
      </DialogDescription>
    </DialogHeader>
  );
}

import {
  Pencil,
  Tag,
  Trash2,
  WashingMachine as WashingMachineIcon,
  Weight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface WashingMachineCardProps {
  name: string;
  statusLabel: string;
  statusColor: string;
  kgText: string;
  brandText: string;
  onEdit: () => void;
  onDelete: () => void;
}

export function WashingMachineCard({
  name,
  statusLabel,
  statusColor,
  kgText,
  brandText,
  onEdit,
  onDelete,
}: WashingMachineCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
              <WashingMachineIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{name}</h3>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border ${statusColor}`}
                >
                  {statusLabel}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1">
                  <Weight className="w-3.5 h-3.5" />
                  {kgText}
                </span>
                <span className="flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" />
                  {brandText}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              className="h-9 w-9"
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-9 w-9 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

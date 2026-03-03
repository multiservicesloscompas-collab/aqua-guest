import { WashingMachine as WashingMachineIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WashingMachinesHeaderProps {
  count: number;
  onNew: () => void;
}

export function WashingMachinesHeader({
  count,
  onNew,
}: WashingMachinesHeaderProps) {
  return (
    <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-4">
      <div className="max-w-lg mx-auto w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
              <WashingMachineIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Lavadoras</h1>
              <p className="text-xs text-muted-foreground">
                {count} registradas
              </p>
            </div>
          </div>
          <Button onClick={onNew} size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Nueva
          </Button>
        </div>
      </div>
    </div>
  );
}

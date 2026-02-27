import { ChevronDown, Copy, WashingMachine } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RentalStatus, RentalStatusLabels, WasherRental } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface RentalCardHeaderProps {
  rental: WasherRental;
  machineName: string;
  machineDetails: string;
  statusClassName: string;
  onCopyId: () => void;
  onStatusClick: (status: RentalStatus) => void;
}

export function RentalCardHeader({
  rental,
  machineName,
  machineDetails,
  statusClassName,
  onCopyId,
  onStatusClick,
}: RentalCardHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <WashingMachine className="w-5 h-5 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <p className="font-semibold">{machineName}</p>
            <button
              onClick={(event) => {
                event.stopPropagation();
                onCopyId();
              }}
              className="p-1 rounded-md text-muted-foreground/30 hover:text-primary hover:bg-primary/10 transition-all opacity-0 group-hover:opacity-100"
              title="Copiar ID de registro"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground">{machineDetails}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(event) => event.stopPropagation()}
              className={cn(
                'flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-medium transition-all hover:opacity-80',
                statusClassName
              )}
            >
              <span>
                {statusIconFor(rental.status)}{' '}
                {RentalStatusLabels[rental.status]}
              </span>
              <ChevronDown className="w-3 h-3 opacity-50" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(Object.keys(RentalStatusLabels) as RentalStatus[]).map(
              (status) => (
                <DropdownMenuItem
                  key={status}
                  onClick={(event) => {
                    event.stopPropagation();
                    onStatusClick(status);
                  }}
                  className={cn(
                    'text-xs flex items-center gap-2',
                    rental.status === status && 'bg-accent font-medium'
                  )}
                  disabled={rental.status === status}
                >
                  <span>{statusIconFor(status)}</span>
                  {RentalStatusLabels[status]}
                </DropdownMenuItem>
              )
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function statusIconFor(status: RentalStatus) {
  const statusIcons: Record<RentalStatus, string> = {
    agendado: '📅',
    enviado: '🚚',
    finalizado: '✅',
  };

  return statusIcons[status];
}

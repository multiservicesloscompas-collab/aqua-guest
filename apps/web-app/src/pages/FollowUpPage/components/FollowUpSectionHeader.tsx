import { AlertCircle } from 'lucide-react';

import { cn } from '@/lib/utils';

interface FollowUpSectionHeaderProps {
  icon: typeof AlertCircle;
  title: string;
  count: number;
  variant?: 'default' | 'warning' | 'info';
}

export function FollowUpSectionHeader({
  icon: Icon,
  title,
  count,
  variant = 'default',
}: FollowUpSectionHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl mb-3',
        variant === 'warning' && 'bg-destructive/10',
        variant === 'info' && 'bg-primary/10',
        variant === 'default' && 'bg-accent/50'
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center w-10 h-10 rounded-lg',
          variant === 'warning' && 'bg-destructive text-destructive-foreground',
          variant === 'info' && 'bg-primary text-primary-foreground',
          variant === 'default' && 'bg-background'
        )}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{count} registro(s)</p>
      </div>
    </div>
  );
}

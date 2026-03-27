import { type ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface TabletControlsCardProps {
  title?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  'data-testid'?: string;
}

export function TabletControlsCard({
  title,
  children,
  className,
  contentClassName,
  'data-testid': dataTestId,
}: TabletControlsCardProps) {
  return (
    <section
      className={cn('bg-card rounded-xl border shadow-card p-4', className)}
      data-testid={dataTestId}
    >
      {title ? (
        <h3 className="text-sm font-semibold text-foreground mb-3">{title}</h3>
      ) : null}

      <div className={cn('space-y-3', contentClassName)}>{children}</div>
    </section>
  );
}

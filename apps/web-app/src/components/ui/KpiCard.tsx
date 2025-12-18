import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning';
  className?: string;
}

const variantStyles = {
  default: 'bg-card',
  primary: 'gradient-primary text-primary-foreground',
  success: 'bg-success/10 border-success/20',
  warning: 'bg-warning/10 border-warning/20',
};

export function KpiCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  variant = 'default',
  className,
}: KpiCardProps) {
  const isPrimary = variant === 'primary';

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl p-4 border shadow-card transition-transform active:scale-[0.98]',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p
            className={cn(
              'text-xs font-medium mb-1',
              isPrimary ? 'text-primary-foreground/80' : 'text-muted-foreground'
            )}
          >
            {title}
          </p>
          <p
            className={cn(
              'text-2xl font-extrabold tracking-tight',
              isPrimary ? 'text-primary-foreground' : 'text-foreground'
            )}
          >
            {value}
          </p>
          {(subtitle || trendValue) && (
            <div className="flex items-center gap-2 mt-1">
              {trendValue && (
                <span
                  className={cn(
                    'text-xs font-semibold',
                    trend === 'up' && 'text-success',
                    trend === 'down' && 'text-destructive',
                    trend === 'neutral' && 'text-muted-foreground'
                  )}
                >
                  {trend === 'up' && '↑'}
                  {trend === 'down' && '↓'}
                  {trendValue}
                </span>
              )}
              {subtitle && (
                <span
                  className={cn(
                    'text-xs',
                    isPrimary
                      ? 'text-primary-foreground/70'
                      : 'text-muted-foreground'
                  )}
                >
                  {subtitle}
                </span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              'p-2 rounded-lg',
              isPrimary ? 'bg-white/20' : 'bg-primary/10'
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

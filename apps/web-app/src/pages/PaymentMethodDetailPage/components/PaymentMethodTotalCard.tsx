import { ComponentType } from 'react';
import { KpiCard } from '@/components/ui/KpiCard';
import { cn } from '@/lib/utils';

interface PaymentMethodTotalCardProps {
  title: string;
  valueText: string;
  subtitleText: string;
  icon: ComponentType<{ className?: string }>;
  iconClass: string;
  borderClass: string;
}

export function PaymentMethodTotalCard({
  title,
  valueText,
  subtitleText,
  icon: Icon,
  iconClass,
  borderClass,
}: PaymentMethodTotalCardProps) {
  return (
    <KpiCard
      title={title}
      value={valueText}
      subtitle={subtitleText}
      icon={<Icon className={cn('w-5 h-5', iconClass)} />}
      variant="primary"
      className={cn('border-2', borderClass)}
    />
  );
}

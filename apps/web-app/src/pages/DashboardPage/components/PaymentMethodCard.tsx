import { ComponentType } from 'react';

interface PaymentMethodCardProps {
  title: string;
  amountText: string;
  convertedText: string;
  testId?: string;
  accent: {
    background: string;
    border: string;
    icon: string;
    title: string;
    value: string;
  };
  icon: ComponentType<{ className?: string }>;
  onClick?: () => void;
}

export function PaymentMethodCard({
  title,
  amountText,
  convertedText,
  testId,
  accent,
  icon: Icon,
  onClick,
}: PaymentMethodCardProps) {
  return (
    <div
      onClick={onClick}
      data-testid={testId}
      className={`flex items-center justify-between p-3 rounded-xl ${accent.background} ${accent.border} cursor-pointer transition-colors active:scale-[0.98]`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${accent.icon}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p
            className={`text-xs font-medium uppercase tracking-wider ${accent.title}`}
          >
            {title}
          </p>
          <p className={`text-base font-bold ${accent.value}`}>{amountText}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs font-medium text-muted-foreground">
          {convertedText}
        </p>
      </div>
    </div>
  );
}

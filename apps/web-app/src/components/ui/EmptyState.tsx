import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  hint: string;
}

export function EmptyState({ icon: Icon, title, hint }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <Icon className="w-12 h-12 mb-3 opacity-40" />
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs">{hint}</p>
    </div>
  );
}

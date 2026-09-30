import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message: string;
}

export function LoadingState({ message }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <Loader2 className="w-8 h-8 mb-3 animate-spin" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

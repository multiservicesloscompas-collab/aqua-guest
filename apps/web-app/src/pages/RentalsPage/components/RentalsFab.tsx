import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RentalsFabProps {
  onClick: () => void;
}

export function RentalsFab({ onClick }: RentalsFabProps) {
  return (
    <Button
      onClick={onClick}
      className={cn(
        'fixed bottom-24 right-4 w-14 h-14 rounded-full gradient-primary shadow-fab z-40',
        'transition-transform hover:scale-105 active:scale-95'
      )}
    >
      <Plus className="w-6 h-6" />
    </Button>
  );
}

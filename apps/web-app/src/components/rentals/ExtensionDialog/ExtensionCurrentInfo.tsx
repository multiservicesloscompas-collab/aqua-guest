import { WasherRental } from '@/types';

interface ExtensionCurrentInfoProps {
  rental: WasherRental;
}

export function ExtensionCurrentInfo({ rental }: ExtensionCurrentInfoProps) {
  return (
    <div className="bg-muted/50 p-3 rounded-lg">
      <div className="text-sm space-y-1">
        <p>
          <span className="font-medium">Retiro actual:</span>{' '}
          {rental.pickupTime} ({rental.pickupDate})
        </p>
        <p>
          <span className="font-medium">Total actual:</span> $
          {rental.totalUsd.toFixed(2)}
        </p>
        {rental.extensions && rental.extensions.length > 0 && (
          <p className="text-amber-600">
            Ya tiene {rental.extensions.length} extensión(es)
          </p>
        )}
      </div>
    </div>
  );
}

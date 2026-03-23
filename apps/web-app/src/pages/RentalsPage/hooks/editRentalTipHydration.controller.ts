import type { Tip } from '@/types/tips';

export interface TipHydrationTicket {
  requestId: number;
  rentalId: string;
}

export function findTipByRentalOrigin(
  tips: readonly Tip[],
  rentalId: string
): Tip | undefined {
  return tips.find(
    (tip) => tip.originType === 'rental' && tip.originId === rentalId
  );
}

export function createTipHydrationController() {
  let requestId = 0;
  let activeRentalId: string | null = null;

  return {
    begin(rentalId: string): TipHydrationTicket {
      requestId += 1;
      activeRentalId = rentalId;
      return {
        requestId,
        rentalId,
      };
    },
    close() {
      requestId += 1;
      activeRentalId = null;
    },
    canApply(ticket: TipHydrationTicket): boolean {
      return (
        ticket.requestId === requestId &&
        activeRentalId !== null &&
        ticket.rentalId === activeRentalId
      );
    },
  };
}

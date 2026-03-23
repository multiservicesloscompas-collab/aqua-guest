import type { Sale, TipPayout } from '@/types';

const SHORT_ID_LENGTH = 8;

export function toShortEntityId(id: string): string {
  if (!id) {
    return 'N/A';
  }
  return id.slice(0, SHORT_ID_LENGTH);
}

export function buildSaleReference(
  sale: Pick<Sale, 'id' | 'dailyNumber'>
): string {
  if (Number.isFinite(sale.dailyNumber) && sale.dailyNumber > 0) {
    return `Venta #${sale.dailyNumber}`;
  }
  return `Venta #${toShortEntityId(sale.id)}`;
}

export function buildRentalReference(rentalId: string): string {
  return `Alquiler #${toShortEntityId(rentalId)}`;
}

export function buildTipPayoutReference(
  payout: Pick<TipPayout, 'originType' | 'originId'>,
  salesById: ReadonlyMap<string, Pick<Sale, 'id' | 'dailyNumber'>>
): string {
  if (payout.originType === 'sale') {
    const sale = salesById.get(payout.originId);
    if (sale) {
      return `Propina de ${buildSaleReference(sale)}`;
    }
  }

  return `Propina de ${payout.originType}:${toShortEntityId(payout.originId)}`;
}

export function buildGenericReference(label: string, id: string): string {
  return `${label} #${toShortEntityId(id)}`;
}

import type {
  SaleReference,
  TipOriginReference,
  WasherRentalReference,
} from '@aqua-guest/domain';

const SHORT_ID_LENGTH = 8;

export function toShortEntityId(id: string): string {
  if (!id) {
    return 'N/A';
  }
  return id.slice(0, SHORT_ID_LENGTH);
}

export function buildSaleReference(sale: SaleReference): string {
  if (Number.isFinite(sale.dailyNumber) && sale.dailyNumber > 0) {
    return `Venta #${sale.dailyNumber}`;
  }
  return `Venta #${toShortEntityId(sale.id)}`;
}

export function buildRentalReference(rental: WasherRentalReference): string {
  return `Alquiler #${toShortEntityId(rental.id)}`;
}

export function buildTipPayoutReference(
  payout: TipOriginReference,
  salesById: ReadonlyMap<string, SaleReference>
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

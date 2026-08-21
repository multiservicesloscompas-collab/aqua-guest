import type {
  TipDailyPayoutRequest,
  TipPayoutSummary,
  TipSinglePayoutRequest,
  TipUpsertInput,
  TipsRepository,
} from '@aqua-guest/product-domain/frontend';
import type { Tip } from '@aqua-guest/domain';
import { appRepositories } from '@/lib/app-repositories';
import type { TipPayout } from '@/types/tips';

type InFlightPayout = Promise<TipPayoutSummary>;

export class TipsDataService {
  private readonly tipsRepository: TipsRepository;
  private readonly inFlightDailyPayouts = new Map<string, InFlightPayout>();

  constructor(
    tipsRepository: TipsRepository = appRepositories.tipsRepository
  ) {
    this.tipsRepository = tipsRepository;
  }

  async upsertTipForOrigin(input: TipUpsertInput): Promise<Tip> {
    this.ensureOriginLink(input.originType, input.originId);
    return this.tipsRepository.upsertByOrigin(input);
  }

  async payTipsForDay(input: TipDailyPayoutRequest): Promise<TipPayoutSummary> {
    this.ensureIdempotencyKey(input.idempotencyKey);
    this.ensurePaidAtAfterTipDate(input.tipDate, input.paidAt, 'propinas');

    const existing = this.inFlightDailyPayouts.get(input.idempotencyKey);
    if (existing) {
      return existing;
    }

    const request = this.tipsRepository.payForDay(input);
    this.inFlightDailyPayouts.set(input.idempotencyKey, request);

    try {
      return await request;
    } finally {
      this.inFlightDailyPayouts.delete(input.idempotencyKey);
    }
  }

  async paySingleTip(input: TipSinglePayoutRequest): Promise<TipPayoutSummary> {
    this.ensureIdempotencyKey(input.idempotencyKey);
    this.ensurePaidAtAfterTipDate(input.tipDate, input.paidAt, 'propina');
    return this.tipsRepository.paySingle(input);
  }

  loadTipsByDateRange(startDate: string, endDate: string): Promise<Tip[]> {
    return this.tipsRepository.loadByDateRange(startDate, endDate);
  }

  loadPaidTipsByDateRange(startDate: string, endDate: string): Promise<Tip[]> {
    return this.tipsRepository.loadPaidByDateRange(startDate, endDate);
  }

  updateTipNote(tipId: string, notes?: string): Promise<Tip> {
    if (!tipId.trim()) {
      throw new Error('tip id requerido');
    }

    return this.tipsRepository.updateNote(tipId, notes);
  }

  async deleteTipByOrigin(originType: string, originId: string): Promise<void> {
    this.ensureOriginLink(originType, originId);
    await this.tipsRepository.deleteByOrigin(
      originType as Tip['originType'],
      originId
    );
  }

  toTipPayoutReadModel(tips: readonly Tip[]): TipPayout[] {
    return tips
      .filter((tip) => tip.status === 'paid')
      .map((tip) => ({
        id: tip.id,
        tipDate: tip.tipDate,
        paidAt: tip.paidAt || tip.updatedAt,
        paymentMethod: tip.paidPaymentMethod || tip.capturePaymentMethod,
        amountBs: tip.amountBs,
        originType: tip.originType,
        originId: tip.originId,
      }));
  }

  private ensureOriginLink(originType: string, originId: string) {
    if (!originType || !originId.trim()) {
      throw new Error('La propina debe estar vinculada a un origen valido');
    }
  }

  private ensureIdempotencyKey(idempotencyKey: string) {
    if (!idempotencyKey.trim()) {
      throw new Error('idempotency key requerido');
    }
  }

  private ensurePaidAtAfterTipDate(
    tipDate: string | undefined,
    paidAt: string | undefined,
    label: string
  ) {
    if (!tipDate || !paidAt) {
      return;
    }

    const paymentDate = new Date(paidAt.split('T')[0]);
    const originalDate = new Date(tipDate.split('T')[0]);
    if (paymentDate < originalDate) {
      throw new Error(
        `La fecha de pago no puede ser anterior a la fecha de la ${label} (${tipDate})`
      );
    }
  }
}

export const tipsDataService = new TipsDataService();

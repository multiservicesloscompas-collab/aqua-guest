import { supabase } from '@/lib/supabaseClient';
import type {
  Tip,
  TipDailyPayoutRequest,
  TipPayout,
  TipPayoutSummary,
  TipSinglePayoutRequest,
  TipUpsertInput,
} from '@/types/tips';
import {
  TIP_SCHEMA_CONTRACT,
  type TipRow,
} from './tipSchemaContract';
import {
  toTipDomain,
  toTipUpsertRow,
} from './tipSupabaseAdapters';

type InFlightPayout = Promise<TipPayoutSummary>;

export class TipsDataService {
  private readonly inFlightDailyPayouts = new Map<string, InFlightPayout>();

  async upsertTipForOrigin(input: TipUpsertInput): Promise<Tip> {
    this.ensureOriginLink(input.originType, input.originId);

    const row = toTipUpsertRow(input);
    const { data, error } = await supabase
      .from(TIP_SCHEMA_CONTRACT.tables.tips)
      .upsert(row, {
        onConflict: `${TIP_SCHEMA_CONTRACT.columns.originType},${TIP_SCHEMA_CONTRACT.columns.originId}`,
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return toTipDomain(data as TipRow);
  }

  async payTipsForDay(input: TipDailyPayoutRequest): Promise<TipPayoutSummary> {
    this.ensureIdempotencyKey(input.idempotencyKey);
    const { tipDate, paymentMethod, paidAt } = input;

    // Frontend Validation
    if (paidAt && tipDate) {
      const pDate = new Date(paidAt.split('T')[0]);
      const oDate = new Date(tipDate.split('T')[0]);
      if (pDate < oDate) {
        throw new Error(
          `La fecha de pago no puede ser anterior a la fecha de las propinas (${tipDate})`
        );
      }
    }

    const existing = this.inFlightDailyPayouts.get(input.idempotencyKey);
    if (existing) {
      return existing;
    }

    const performPayout = async (): Promise<TipPayoutSummary> => {
      const { data, error } = await supabase
        .from(TIP_SCHEMA_CONTRACT.tables.tips)
        .update({
          [TIP_SCHEMA_CONTRACT.columns.status]: 'paid',
          [TIP_SCHEMA_CONTRACT.columns.paidPaymentMethod]: paymentMethod,
          [TIP_SCHEMA_CONTRACT.columns.paidAt]:
            paidAt || new Date().toISOString(),
          [TIP_SCHEMA_CONTRACT.columns.updatedAt]: new Date().toISOString(),
        })
        .eq(TIP_SCHEMA_CONTRACT.columns.tipDate, tipDate)
        .eq(TIP_SCHEMA_CONTRACT.columns.status, 'pending')
        .select(TIP_SCHEMA_CONTRACT.columns.amountBs);

      if (error) {
        throw error;
      }

      const updatedRows = (data ?? []) as any[];
      const totalAmount = updatedRows.reduce(
        (sum, t) => sum + Number(t[TIP_SCHEMA_CONTRACT.columns.amountBs]),
        0
      );
      const count = updatedRows.length;

      return {
        date: tipDate,
        paymentMethod: paymentMethod,
        paidCount: count,
        totalAmountBs: totalAmount,
      };
    };

    const request = performPayout();
    this.inFlightDailyPayouts.set(input.idempotencyKey, request);

    try {
      return await request;
    } finally {
      this.inFlightDailyPayouts.delete(input.idempotencyKey);
    }
  }

  async paySingleTip(input: TipSinglePayoutRequest): Promise<TipPayoutSummary> {
    this.ensureIdempotencyKey(input.idempotencyKey);
    const { tipId, paymentMethod, paidAt, tipDate } = input;

    // Frontend Validation: Payment date cannot be before tip date
    if (paidAt && tipDate) {
      const pDate = new Date(paidAt.split('T')[0]);
      const oDate = new Date(tipDate.split('T')[0]);
      if (pDate < oDate) {
        throw new Error(
          `La fecha de pago no puede ser anterior a la fecha de la propina (${tipDate})`
        );
      }
    }

    const { data, error } = await supabase
      .from(TIP_SCHEMA_CONTRACT.tables.tips)
      .update({
        [TIP_SCHEMA_CONTRACT.columns.status]: 'paid',
        [TIP_SCHEMA_CONTRACT.columns.paidPaymentMethod]: paymentMethod,
        [TIP_SCHEMA_CONTRACT.columns.paidAt]:
          paidAt || new Date().toISOString(),
        [TIP_SCHEMA_CONTRACT.columns.updatedAt]: new Date().toISOString(),
      })
      .eq(TIP_SCHEMA_CONTRACT.columns.id, tipId)
      .eq(TIP_SCHEMA_CONTRACT.columns.status, 'pending')
      .select(`${TIP_SCHEMA_CONTRACT.columns.tipDate}, ${TIP_SCHEMA_CONTRACT.columns.amountBs}`);

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return {
        date: tipDate || '',
        paymentMethod: paymentMethod,
        paidCount: 0,
        totalAmountBs: 0,
      };
    }

    const tip = data[0] as any;
    return {
      date: tip[TIP_SCHEMA_CONTRACT.columns.tipDate],
      paymentMethod: paymentMethod,
      paidCount: 1,
      totalAmountBs: tip[TIP_SCHEMA_CONTRACT.columns.amountBs],
    };
  }

  async loadTipsByDateRange(
    startDate: string,
    endDate: string
  ): Promise<Tip[]> {
    const { data, error } = await supabase
      .from(TIP_SCHEMA_CONTRACT.tables.tips)
      .select('*')
      .gte(TIP_SCHEMA_CONTRACT.columns.tipDate, startDate)
      .lte(TIP_SCHEMA_CONTRACT.columns.tipDate, endDate)
      .order(TIP_SCHEMA_CONTRACT.columns.createdAt, { ascending: true });

    if (error) {
      throw error;
    }

    return ((data ?? []) as TipRow[]).map(toTipDomain);
  }

  async loadPaidTipsByDateRange(
    startDate: string,
    endDate: string
  ): Promise<Tip[]> {
    // We filter by the date part of paid_at
    const { data, error } = await supabase
      .from(TIP_SCHEMA_CONTRACT.tables.tips)
      .select('*')
      .eq(TIP_SCHEMA_CONTRACT.columns.status, 'paid')
      .gte(TIP_SCHEMA_CONTRACT.columns.paidAt, `${startDate}T00:00:00Z`)
      .lte(TIP_SCHEMA_CONTRACT.columns.paidAt, `${endDate}T23:59:59Z`)
      .order(TIP_SCHEMA_CONTRACT.columns.paidAt, { ascending: true });

    if (error) {
      throw error;
    }

    return ((data ?? []) as TipRow[]).map(toTipDomain);
  }

  async updateTipNote(tipId: string, notes?: string): Promise<Tip> {
    if (!tipId.trim()) {
      throw new Error('tip id requerido');
    }

    const normalizedNotes = notes?.trim() ? notes.trim() : null;
    const { data, error } = await supabase
      .from(TIP_SCHEMA_CONTRACT.tables.tips)
      .update({
        [TIP_SCHEMA_CONTRACT.columns.notes]: normalizedNotes,
      })
      .eq(TIP_SCHEMA_CONTRACT.columns.id, tipId)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return toTipDomain(data as TipRow);
  }

  async deleteTipByOrigin(originType: string, originId: string): Promise<void> {
    this.ensureOriginLink(originType, originId);

    const { error } = await supabase
      .from(TIP_SCHEMA_CONTRACT.tables.tips)
      .delete()
      .eq(TIP_SCHEMA_CONTRACT.columns.originType, originType)
      .eq(TIP_SCHEMA_CONTRACT.columns.originId, originId);

    if (error) {
      throw error;
    }
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
}

export const tipsDataService = new TipsDataService();

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
  type TipPayoutRpcRow,
  type TipRow,
} from './tipSchemaContract';
import {
  toTipDomain,
  toTipPayoutSummary,
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

    const existing = this.inFlightDailyPayouts.get(input.idempotencyKey);
    if (existing) {
      return existing;
    }

    const request = this.runDailyPayoutRpc(input);
    this.inFlightDailyPayouts.set(input.idempotencyKey, request);

    try {
      return await request;
    } finally {
      this.inFlightDailyPayouts.delete(input.idempotencyKey);
    }
  }

  async paySingleTip(input: TipSinglePayoutRequest): Promise<TipPayoutSummary> {
    this.ensureIdempotencyKey(input.idempotencyKey);

    const { data, error } = await supabase.rpc(
      TIP_SCHEMA_CONTRACT.rpc.paySingleTip,
      {
        p_tip_id: input.tipId,
        p_payment_method: input.paymentMethod,
        p_idempotency_key: input.idempotencyKey,
      }
    );

    if (error) {
      throw error;
    }

    return toTipPayoutSummary(data as TipPayoutRpcRow);
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

  private async runDailyPayoutRpc(
    input: TipDailyPayoutRequest
  ): Promise<TipPayoutSummary> {
    const { data, error } = await supabase.rpc(
      TIP_SCHEMA_CONTRACT.rpc.payTipsForDay,
      {
        p_tip_date: input.tipDate,
        p_payment_method: input.paymentMethod,
        p_idempotency_key: input.idempotencyKey,
      }
    );

    if (error) {
      throw error;
    }

    return toTipPayoutSummary(data as TipPayoutRpcRow);
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

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TipsDataService } from './TipDataService';

const {
  rpcMock,
  tipsDeleteMock,
  tipsDeleteEqOriginTypeMock,
  tipsDeleteEqOriginIdMock,
  tipsSingleMock,
  tipsSelectMock,
  tipsUpsertMock,
  tipsUpdateMock,
  tipsEqMock,
} = vi.hoisted(() => ({
  rpcMock: vi.fn(),
  tipsDeleteMock: vi.fn(),
  tipsDeleteEqOriginTypeMock: vi.fn(),
  tipsDeleteEqOriginIdMock: vi.fn(),
  tipsSingleMock: vi.fn(),
  tipsSelectMock: vi.fn(),
  tipsUpsertMock: vi.fn(),
  tipsUpdateMock: vi.fn(),
  tipsEqMock: vi.fn(),
}));

vi.mock('@/lib/supabaseClient', () => {
  const from = vi.fn((table: string) => {
    if (table === 'tips') {
      return {
        delete: tipsDeleteMock,
        upsert: tipsUpsertMock,
        update: tipsUpdateMock,
      };
    }

    throw new Error(`Unexpected table ${table}`);
  });

  const client = {
    from,
    rpc: rpcMock,
  };

  return {
    default: client,
    supabase: client,
  };
});

describe('TipsDataService', () => {
  beforeEach(() => {
    rpcMock.mockReset();
    tipsSingleMock.mockReset();
    tipsSelectMock.mockReset();
    tipsUpsertMock.mockReset();
    tipsUpdateMock.mockReset();
    tipsEqMock.mockReset();
    tipsDeleteMock.mockReset();
    tipsDeleteEqOriginTypeMock.mockReset();
    tipsDeleteEqOriginIdMock.mockReset();

    tipsSelectMock.mockImplementation(() => ({ single: tipsSingleMock }));
    tipsUpsertMock.mockImplementation(() => ({ select: tipsSelectMock }));
    tipsEqMock.mockImplementation(() => ({
      select: tipsSelectMock,
    }));
    tipsUpdateMock.mockImplementation(() => ({
      eq: tipsEqMock,
    }));
    tipsDeleteEqOriginIdMock.mockResolvedValue({ error: null });
    tipsDeleteEqOriginTypeMock.mockImplementation(() => ({
      eq: tipsDeleteEqOriginIdMock,
    }));
    tipsDeleteMock.mockImplementation(() => ({
      eq: tipsDeleteEqOriginTypeMock,
    }));
  });

  it('requires origin link when creating or editing a tip', async () => {
    const service = new TipsDataService();

    await expect(
      service.upsertTipForOrigin({
        originType: 'sale',
        originId: '',
        tipDate: '2026-03-13',
        amountBs: 10,
        capturePaymentMethod: 'efectivo',
      })
    ).rejects.toThrow('origen');
  });

  it('deduplicates concurrent daily payout requests by idempotency key', async () => {
    const service = new TipsDataService();

    rpcMock.mockImplementation(
      async (_fn: string, payload: Record<string, string>) => {
        await Promise.resolve();
        return {
          data: {
            paid_count: 2,
            total_amount_bs: 80,
            tip_date: payload.p_tip_date,
            payment_method: payload.p_payment_method,
          },
          error: null,
        };
      }
    );

    const request = {
      tipDate: '2026-03-13',
      paymentMethod: 'efectivo' as const,
      idempotencyKey: 'tips:2026-03-13:efectivo',
    };

    const [resultA, resultB] = await Promise.all([
      service.payTipsForDay(request),
      service.payTipsForDay(request),
    ]);

    expect(rpcMock).toHaveBeenCalledTimes(1);
    expect(resultA).toEqual(resultB);
    expect(resultA.paidCount).toBe(2);
    expect(resultA.totalAmountBs).toBe(80);
  });

  it('persists tip rows through strict schema contract mapping', async () => {
    const service = new TipsDataService();

    tipsSingleMock.mockResolvedValueOnce({
      data: {
        id: 'tip-1',
        origin_type: 'sale',
        origin_id: 'sale-1',
        tip_date: '2026-03-13',
        amount_bs: 15,
        amount_usd: 0.3,
        exchange_rate_used: 50,
        capture_payment_method: 'pago_movil',
        status: 'pending',
        paid_payment_method: null,
        paid_at: null,
        notes: 'mesa 3',
        created_at: '2026-03-13T10:00:00.000Z',
        updated_at: '2026-03-13T10:00:00.000Z',
      },
      error: null,
    });

    const tip = await service.upsertTipForOrigin({
      originType: 'sale',
      originId: 'sale-1',
      tipDate: '2026-03-13',
      amountBs: 15,
      amountUsd: 0.3,
      exchangeRateUsed: 50,
      capturePaymentMethod: 'pago_movil',
      notes: 'mesa 3',
    });

    expect(tipsUpsertMock).toHaveBeenCalledTimes(1);
    expect(tip.id).toBe('tip-1');
    expect(tip.originType).toBe('sale');
    expect(tip.originId).toBe('sale-1');
    expect(tip.capturePaymentMethod).toBe('pago_movil');
  });

  it('updates notes for an existing tip by id', async () => {
    const service = new TipsDataService();

    tipsSingleMock.mockResolvedValueOnce({
      data: {
        id: 'tip-2',
        origin_type: 'sale',
        origin_id: 'sale-4',
        tip_date: '2026-03-13',
        amount_bs: 10,
        capture_payment_method: 'efectivo',
        status: 'pending',
        notes: 'nota nueva',
        created_at: '2026-03-13T09:00:00.000Z',
        updated_at: '2026-03-13T10:00:00.000Z',
      },
      error: null,
    });

    const result = await service.updateTipNote('tip-2', 'nota nueva');

    expect(tipsUpdateMock).toHaveBeenCalledWith({ notes: 'nota nueva' });
    expect(tipsEqMock).toHaveBeenCalledWith('id', 'tip-2');
    expect(result.notes).toBe('nota nueva');
  });

  it('deletes tips linked to a specific origin', async () => {
    const service = new TipsDataService();

    await service.deleteTipByOrigin('sale', 'sale-5');

    expect(tipsDeleteMock).toHaveBeenCalledTimes(1);
    expect(tipsDeleteEqOriginTypeMock).toHaveBeenCalledWith(
      'origin_type',
      'sale'
    );
    expect(tipsDeleteEqOriginIdMock).toHaveBeenCalledWith(
      'origin_id',
      'sale-5'
    );
  });
});

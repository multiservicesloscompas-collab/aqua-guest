import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useTipStore } from './useTipStore';

const {
  loadTipsByDateRangeMock,
  toTipPayoutReadModelMock,
  updateTipNoteMock,
  paySingleTipMock,
} = vi.hoisted(() => ({
  loadTipsByDateRangeMock: vi.fn(),
  toTipPayoutReadModelMock: vi.fn(),
  updateTipNoteMock: vi.fn(),
  paySingleTipMock: vi.fn(),
}));

vi.mock('@/services/tips/TipDataService', () => ({
  tipsDataService: {
    loadTipsByDateRange: loadTipsByDateRangeMock,
    toTipPayoutReadModel: toTipPayoutReadModelMock,
    updateTipNote: updateTipNoteMock,
    paySingleTip: paySingleTipMock,
  },
}));

describe('useTipStore', () => {
  beforeEach(() => {
    loadTipsByDateRangeMock.mockReset();
    toTipPayoutReadModelMock.mockReset();
    updateTipNoteMock.mockReset();
    paySingleTipMock.mockReset();

    toTipPayoutReadModelMock.mockImplementation((tips) =>
      tips.map((tip: { id: string; tipDate: string; amountBs: number }) => ({
        id: tip.id,
        tipDate: tip.tipDate,
        paidAt: `${tip.tipDate}T12:00:00.000Z`,
        paymentMethod: 'efectivo',
        amountBs: tip.amountBs,
        originType: 'sale',
        originId: 'origin',
      }))
    );

    useTipStore.setState({
      tips: [],
      tipPayouts: [],
      loadingByRange: {},
    });
  });

  it('loads tips range and derives payout read model without duplicates by day reload', async () => {
    loadTipsByDateRangeMock
      .mockResolvedValueOnce([
        {
          id: 'tip-1',
          originType: 'sale',
          originId: 'sale-1',
          tipDate: '2026-03-13',
          amountBs: 10,
          capturePaymentMethod: 'efectivo',
          status: 'pending',
          createdAt: '2026-03-13T10:00:00.000Z',
          updatedAt: '2026-03-13T10:00:00.000Z',
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'tip-2',
          originType: 'sale',
          originId: 'sale-2',
          tipDate: '2026-03-13',
          amountBs: 20,
          capturePaymentMethod: 'pago_movil',
          status: 'paid',
          paidPaymentMethod: 'pago_movil',
          paidAt: '2026-03-13T11:00:00.000Z',
          createdAt: '2026-03-13T10:30:00.000Z',
          updatedAt: '2026-03-13T11:00:00.000Z',
        },
      ]);

    await useTipStore
      .getState()
      .loadTipsByDateRange('2026-03-13', '2026-03-13');
    await useTipStore
      .getState()
      .loadTipsByDateRange('2026-03-13', '2026-03-13');

    const { tips, tipPayouts } = useTipStore.getState();

    expect(loadTipsByDateRangeMock).toHaveBeenCalledTimes(2);
    expect(tips.map((tip) => tip.id)).toEqual(['tip-2']);
    expect(tipPayouts.map((payout) => payout.id)).toEqual(['tip-2']);
  });

  it('replaces cached tips using Venezuela day normalization for ISO tipDate values', async () => {
    useTipStore.setState({
      tips: [
        {
          id: 'tip-old',
          originType: 'sale',
          originId: 'sale-old',
          tipDate: '2026-03-13',
          amountBs: 11,
          capturePaymentMethod: 'efectivo',
          status: 'pending',
          createdAt: '2026-03-13T08:00:00.000Z',
          updatedAt: '2026-03-13T08:00:00.000Z',
        },
      ],
      tipPayouts: [],
      loadingByRange: {},
    });

    loadTipsByDateRangeMock.mockResolvedValueOnce([
      {
        id: 'tip-new',
        originType: 'sale',
        originId: 'sale-new',
        tipDate: '2026-03-14T01:30:00.000Z',
        amountBs: 20,
        capturePaymentMethod: 'pago_movil',
        status: 'pending',
        createdAt: '2026-03-14T01:30:00.000Z',
        updatedAt: '2026-03-14T01:30:00.000Z',
      },
    ]);

    await useTipStore
      .getState()
      .loadTipsByDateRange('2026-03-13', '2026-03-13');

    const { tips } = useTipStore.getState();
    expect(tips.map((tip) => tip.id)).toEqual(['tip-new']);
  });

  it('updates note and refreshes tip list read model', async () => {
    useTipStore.setState({
      tips: [
        {
          id: 'tip-1',
          originType: 'sale',
          originId: 'sale-1',
          tipDate: '2026-03-13',
          amountBs: 10,
          capturePaymentMethod: 'efectivo',
          status: 'pending',
          notes: 'nota vieja',
          createdAt: '2026-03-13T10:00:00.000Z',
          updatedAt: '2026-03-13T10:00:00.000Z',
        },
      ],
      tipPayouts: [],
      loadingByRange: {},
    });

    updateTipNoteMock.mockResolvedValueOnce({
      id: 'tip-1',
      originType: 'sale',
      originId: 'sale-1',
      tipDate: '2026-03-13',
      amountBs: 10,
      capturePaymentMethod: 'efectivo',
      status: 'pending',
      notes: 'nota nueva',
      createdAt: '2026-03-13T10:00:00.000Z',
      updatedAt: '2026-03-13T11:00:00.000Z',
    });

    await useTipStore.getState().updateTipNote('tip-1', 'nota nueva');

    const { tips } = useTipStore.getState();
    expect(updateTipNoteMock).toHaveBeenCalledWith('tip-1', 'nota nueva');
    expect(tips[0].notes).toBe('nota nueva');
  });

  it('pays single tip and reloads selected day', async () => {
    paySingleTipMock.mockResolvedValueOnce({
      date: '2026-03-13',
      paymentMethod: 'efectivo',
      paidCount: 1,
      totalAmountBs: 10,
    });
    loadTipsByDateRangeMock.mockResolvedValueOnce([]);

    await useTipStore.getState().paySingleTip({
      tipId: 'tip-1',
      tipDate: '2026-03-13',
      paymentMethod: 'efectivo',
    });

    expect(paySingleTipMock).toHaveBeenCalledTimes(1);
    expect(paySingleTipMock.mock.calls[0][0]).toMatchObject({
      tipId: 'tip-1',
      paymentMethod: 'efectivo',
    });
    expect(paySingleTipMock.mock.calls[0][0].idempotencyKey).toContain(
      'tip-single:tip-1:efectivo:'
    );
    expect(loadTipsByDateRangeMock).toHaveBeenCalledWith(
      '2026-03-13',
      '2026-03-13'
    );
  });
});

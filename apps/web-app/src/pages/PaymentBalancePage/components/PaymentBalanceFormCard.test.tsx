import type { ComponentProps, HTMLAttributes, ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PaymentBalanceFormCard } from './PaymentBalanceFormCard';

vi.mock('@/components/ui/tabs', async () => {
  const React = await import('react');

  type TabsContextValue = {
    value: string;
    onValueChange: (value: string) => void;
  };

  const TabsContext = React.createContext<TabsContextValue | null>(null);

  const Tabs = ({
    value,
    onValueChange,
    children,
    className,
  }: {
    value: string;
    onValueChange: (value: string) => void;
    children: ReactNode;
    className?: string;
  }) => (
    <div className={className}>
      <TabsContext.Provider value={{ value, onValueChange }}>
        {children}
      </TabsContext.Provider>
    </div>
  );

  const TabsList = ({
    children,
    className,
    ...props
  }: HTMLAttributes<HTMLDivElement>) => (
    <div role="tablist" className={className} {...props}>
      {children}
    </div>
  );

  const TabsTrigger = ({
    value,
    children,
    className,
  }: {
    value: string;
    children: ReactNode;
    className?: string;
  }) => {
    const context = React.useContext(TabsContext);
    if (!context) {
      throw new Error('TabsTrigger must be used within Tabs');
    }

    const isSelected = context.value === value;

    return (
      <button
        type="button"
        role="tab"
        className={className}
        aria-selected={isSelected}
        onClick={() => context.onValueChange(value)}
      >
        {children}
      </button>
    );
  };

  return { Tabs, TabsList, TabsTrigger };
});

type FormDataUpdater = Parameters<
  ComponentProps<typeof PaymentBalanceFormCard>['onFormDataChange']
>[0];

function renderFormCard(
  overrides: Partial<ComponentProps<typeof PaymentBalanceFormCard>> = {}
) {
  const onFormDataChange = vi.fn();

  render(
    <PaymentBalanceFormCard
      formData={{
        operationType: 'equilibrio',
        fromMethod: 'efectivo',
        toMethod: 'pago_movil',
        amountOut: '10',
        amountIn: '10',
        notes: '',
      }}
      editingTransaction={null}
      exchangeRate={36}
      isAdding={false}
      isUpdating={false}
      onFormDataChange={onFormDataChange}
      onAdd={vi.fn()}
      onUpdate={vi.fn()}
      onCancelEdit={vi.fn()}
      getMethodIcon={() => '💵'}
      {...overrides}
    />
  );

  return { onFormDataChange };
}

describe('PaymentBalanceFormCard', () => {
  it('renders operation type as accessible tablist', () => {
    renderFormCard();

    const tabList = screen.getByRole('tablist');
    const equilibrioTab = screen.getByRole('tab', { name: 'Equilibrio' });
    const avanceTab = screen.getByRole('tab', { name: 'Avance' });

    expect(tabList).toBeInTheDocument();
    expect(equilibrioTab).toHaveAttribute('aria-selected', 'true');
    expect(avanceTab).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByLabelText('Tipo de operación')).toBeInTheDocument();
  });

  it('keeps amountIn unchanged when switching to avance', () => {
    const { onFormDataChange } = renderFormCard({
      formData: {
        operationType: 'equilibrio',
        fromMethod: 'efectivo',
        toMethod: 'pago_movil',
        amountOut: '80',
        amountIn: '75',
        notes: '',
      },
    });

    fireEvent.click(screen.getByRole('tab', { name: 'Avance' }));

    const updater = onFormDataChange.mock.calls[0][0] as FormDataUpdater;
    const next = updater({
      operationType: 'equilibrio',
      fromMethod: 'efectivo',
      toMethod: 'pago_movil',
      amountOut: '80',
      amountIn: '75',
      notes: '',
    });

    expect(next.operationType).toBe('avance');
    expect(next.amountIn).toBe('75');
  });

  it('syncs amountIn with amountOut when switching to equilibrio', () => {
    const { onFormDataChange } = renderFormCard({
      formData: {
        operationType: 'avance',
        fromMethod: 'efectivo',
        toMethod: 'pago_movil',
        amountOut: '120',
        amountIn: '100',
        notes: '',
      },
    });

    fireEvent.click(screen.getByRole('tab', { name: 'Equilibrio' }));

    const updater = onFormDataChange.mock.calls[0][0] as FormDataUpdater;
    const next = updater({
      operationType: 'avance',
      fromMethod: 'efectivo',
      toMethod: 'pago_movil',
      amountOut: '120',
      amountIn: '100',
      notes: '',
    });

    expect(next.operationType).toBe('equilibrio');
    expect(next.amountIn).toBe('120');
  });
});

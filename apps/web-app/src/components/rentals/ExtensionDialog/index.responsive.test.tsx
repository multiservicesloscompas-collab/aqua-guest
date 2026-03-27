import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ExtensionDialog } from './index';

vi.mock('./useExtensionDialogViewModel', () => ({
  useExtensionDialogViewModel: () => ({
    canRender: true,
    canAddExtension: true,
    selectedHours: 2,
    setSelectedHours: vi.fn(),
    customHours: '',
    setCustomHours: vi.fn(),
    customFee: '',
    setCustomFee: vi.fn(),
    extensionType: 'horas',
    setExtensionType: vi.fn(),
    pricingType: 'manual',
    setPricingType: vi.fn(),
    notes: '',
    setNotes: vi.fn(),
    isSubmitting: false,
    calculatedCustomFee: 0,
    finalFee: 0,
    extensionHours: 2,
    newPickupInfo: { pickupDate: '2026-03-08', pickupTime: '11:00' },
    isSubmitDisabled: false,
    handleDeleteExtension: vi.fn(),
    handleSubmit: vi.fn(),
    handleCancel: vi.fn(),
  }),
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogContent: ({
    tabletClassName,
    className,
    children,
  }: {
    tabletClassName?: string;
    className?: string;
    children: ReactNode;
  }) => (
    <div
      data-testid="extension-dialog-content"
      data-tablet-class={tabletClassName}
      className={className}
    >
      {children}
    </div>
  ),
}));

vi.mock('./ExtensionDialogHeader', () => ({
  ExtensionDialogHeader: () => <div>Header</div>,
}));

vi.mock('./ExtensionCurrentInfo', () => ({
  ExtensionCurrentInfo: () => <div>CurrentInfo</div>,
}));

vi.mock('./ExtensionAppliedList', () => ({
  ExtensionAppliedList: () => <div>AppliedList</div>,
}));

vi.mock('./ExtensionForm', () => ({
  ExtensionForm: () => <div>Form</div>,
}));

vi.mock('./ExtensionDialogFooter', () => ({
  ExtensionDialogFooter: () => <div>Footer</div>,
}));

describe('ExtensionDialog responsive overlay hardening', () => {
  it('provides tablet width override while preserving base classes', () => {
    render(
      <ExtensionDialog
        rental={
          {
            id: 'r-1',
            customerName: 'Cliente',
            pickupDate: '2026-03-08',
            pickupTime: '10:00',
            extensions: [],
            totalUsd: 10,
          } as never
        }
        open
        onOpenChange={() => undefined}
        onExtensionApplied={() => undefined}
      />
    );

    const dialogContent = screen.getByTestId('extension-dialog-content');

    expect(dialogContent).toHaveAttribute(
      'data-tablet-class',
      'sm:max-w-[520px]'
    );
    expect(dialogContent).toHaveClass('sm:max-w-[425px]');
  });
});

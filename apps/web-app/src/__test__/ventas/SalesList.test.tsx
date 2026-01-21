import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SalesList } from '@/components/ventas/SalesList';
import { Sale, PaymentMethod, CartItem } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';
import { EditSaleSheet } from '@/components/ventas/EditSaleSheet';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock de dependencias externas
vi.mock('@/store/useAppStore');
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/components/ventas/EditSaleSheet', () => ({
  EditSaleSheet: vi.fn(({ sale, open, onOpenChange }) => {
    if (!open) return null;
    return (
      <div data-testid="edit-sale-sheet">
        <div data-testid="editing-sale-id">{sale?.id}</div>
        <button onClick={() => onOpenChange(false)}>Close</button>
      </div>
    );
  }),
}));

// Mock de Lucide icons
vi.mock('lucide-react', () => ({
  Trash2: () => <div data-testid="trash-icon" />,
  Smartphone: () => <div data-testid="smartphone-icon" />,
  Banknote: () => <div data-testid="banknote-icon" />,
  CreditCard: () => <div data-testid="credit-card-icon" />,
  FileText: () => <div data-testid="file-text-icon" />,
  Pencil: () => <div data-testid="pencil-icon" />,
  DollarSign: () => <div data-testid="dollar-sign-icon" />,
}));

// Mock de componentes UI
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children }: any) => <div data-testid="alert-dialog">{children}</div>,
  AlertDialogAction: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props} data-testid="alert-dialog-action">
      {children}
    </button>
  ),
  AlertDialogCancel: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props} data-testid="alert-dialog-cancel">
      {children}
    </button>
  ),
  AlertDialogContent: ({ children }: any) => <div data-testid="alert-dialog-content">{children}</div>,
  AlertDialogDescription: ({ children }: any) => <div>{children}</div>,
  AlertDialogFooter: ({ children }: any) => <div data-testid="alert-dialog-footer">{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div data-testid="alert-dialog-header">{children}</div>,
  AlertDialogTitle: ({ children }: any) => <div>{children}</div>,
  AlertDialogTrigger: ({ children }: any) => <div>{children}</div>,
}));

const mockUseAppStore = useAppStore as any;
const mockToast = toast as any;

// Datos de prueba
const createMockSale = (overrides: Partial<Sale> = {}): Sale => ({
  id: 'sale-1',
  dailyNumber: 1,
  date: '2024-01-15',
  items: [
    {
      id: 'item-1',
      productId: 'product-1',
      productName: 'Agua 20L',
      quantity: 2,
      unitPrice: 50,
      subtotal: 100,
    },
  ],
  paymentMethod: 'efectivo',
  totalBs: 100,
  totalUsd: 2.5,
  exchangeRate: 40,
  notes: 'Nota de prueba',
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-01-15T10:30:00Z',
  ...overrides,
});

const createMockCartItem = (overrides: Partial<CartItem> = {}): CartItem => ({
  id: 'item-1',
  productId: 'product-1',
  productName: 'Agua 20L',
  quantity: 2,
  unitPrice: 50,
  subtotal: 100,
  ...overrides,
});

describe('SalesList Component', () => {
  const mockDeleteSale = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAppStore.mockReturnValue({
      deleteSale: mockDeleteSale,
    } as any);

    mockToast.success.mockImplementation(() => {});
    mockToast.error.mockImplementation(() => {});
  });

  describe('Renderizado básico', () => {
    it('debería renderizar correctamente con ventas', () => {
      const sales = [createMockSale()];

      render(<SalesList sales={sales} />);

      expect(screen.getByText('Ventas del Día (1)')).toBeInTheDocument();
      expect(screen.getByTestId('total-sales')).toHaveTextContent('Bs 100.00');
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('2x Agua 20L')).toBeInTheDocument();
      expect(screen.getByText('Nota de prueba')).toBeInTheDocument();
    });

    it('debería mostrar mensaje de vacío cuando no hay ventas', () => {
      render(<SalesList sales={[]} />);

      expect(screen.getByText('Sin ventas este día')).toBeInTheDocument();
      expect(screen.getByText('Presiona + para agregar una venta')).toBeInTheDocument();
      expect(screen.getByTestId('file-text-icon')).toBeInTheDocument();
    });

    it('debería mostrar mensaje de vacío con filtro específico', () => {
      render(<SalesList sales={[]} paymentFilter="pago_movil" />);

      expect(screen.getByText('Sin ventas con Pago Móvil')).toBeInTheDocument();
    });

    it('debería mostrar el título con filtro aplicado', () => {
      const sales = [createMockSale({ paymentMethod: 'pago_movil' })];

      render(<SalesList sales={sales} paymentFilter="pago_movil" />);

      expect(screen.getByText('Ventas del Día (1)')).toBeInTheDocument();
      expect(screen.getByText('(Pago Móvil)')).toBeInTheDocument();
    });
  });

  describe('Filtrado por método de pago', () => {
    it('debería filtrar ventas por método de pago específico', () => {
      const sales = [
        createMockSale({ paymentMethod: 'efectivo', totalBs: 100 }),
        createMockSale({ id: 'sale-2', paymentMethod: 'pago_movil', totalBs: 200 }),
        createMockSale({ id: 'sale-3', paymentMethod: 'punto_venta', totalBs: 300 }),
      ];

      render(<SalesList sales={sales} paymentFilter="efectivo" />);

      expect(screen.getByText('Ventas del Día (1)')).toBeInTheDocument();
      expect(screen.getByTestId('total-sales')).toHaveTextContent('Bs 100.00');
      expect(screen.queryByText('Bs 200.00')).not.toBeInTheDocument();
      expect(screen.queryByText('Bs 300.00')).not.toBeInTheDocument();
    });

    it('debería mostrar todas las ventas cuando el filtro es "todos"', () => {
      const sales = [
        createMockSale({ paymentMethod: 'efectivo', totalBs: 100 }),
        createMockSale({ id: 'sale-2', paymentMethod: 'pago_movil', totalBs: 200 }),
      ];

      render(<SalesList sales={sales} paymentFilter="todos" />);

      expect(screen.getByText('Ventas del Día (2)')).toBeInTheDocument();
      expect(screen.getByTestId('total-sales')).toHaveTextContent('Bs 300.00');
    });

    it('debería usar el filtro por defecto "todos" cuando no se especifica', () => {
      const sales = [
        createMockSale({ paymentMethod: 'efectivo', totalBs: 100 }),
        createMockSale({ id: 'sale-2', paymentMethod: 'pago_movil', totalBs: 200 }),
      ];

      render(<SalesList sales={sales} />);

      expect(screen.getByText('Ventas del Día (2)')).toBeInTheDocument();
      expect(screen.getByTestId('total-sales')).toHaveTextContent('Bs 300.00');
    });
  });

  describe('Cálculo de totales', () => {
    it('debería calcular correctamente el total de todas las ventas', () => {
      const sales = [
        createMockSale({ totalBs: 100 }),
        createMockSale({ id: 'sale-2', totalBs: 200 }),
        createMockSale({ id: 'sale-3', totalBs: 150.5 }),
      ];

      render(<SalesList sales={sales} />);

      expect(screen.getByTestId('total-sales')).toHaveTextContent('Bs 450.50');
    });

    it('debería manejar valores NaN en los totales', () => {
      const sales = [
        createMockSale({ totalBs: NaN }),
        createMockSale({ id: 'sale-2', totalBs: 100 }),
      ];

      render(<SalesList sales={sales} />);

      expect(screen.getByTestId('total-sales')).toHaveTextContent('Bs 100.00');
    });

    it('debería manejar valores undefined en los totales', () => {
      const sales = [
        createMockSale({ totalBs: undefined as any }),
        createMockSale({ id: 'sale-2', totalBs: 100 }),
      ];

      render(<SalesList sales={sales} />);

      expect(screen.getByTestId('total-sales')).toHaveTextContent('Bs 100.00');
    });

    it('debería calcular total solo para ventas filtradas', () => {
      const sales = [
        createMockSale({ paymentMethod: 'efectivo', totalBs: 100 }),
        createMockSale({ id: 'sale-2', paymentMethod: 'pago_movil', totalBs: 200 }),
      ];

      render(<SalesList sales={sales} paymentFilter="efectivo" />);

      expect(screen.getByTestId('total-sales')).toHaveTextContent('Bs 100.00');
    });
  });

  describe('Renderizado de ítems de venta', () => {
    it('debería mostrar ítems correctamente', () => {
      const sales = [
        createMockSale({
          items: [
            createMockCartItem({ productName: 'Agua 20L', quantity: 2 }),
            createMockCartItem({ id: 'item-2', productName: 'Bebida 1L', quantity: 3 }),
          ],
        }),
      ];

      render(<SalesList sales={sales} />);

      expect(screen.getByText('2x Agua 20L')).toBeInTheDocument();
      expect(screen.getByText('3x Bebida 1L')).toBeInTheDocument();
    });

    it('debería manejar ítems con litros', () => {
      const sales = [
        createMockSale({
          items: [
            createMockCartItem({ productName: 'Agua', quantity: 1, liters: 20 }),
          ],
        }),
      ];

      render(<SalesList sales={sales} />);

      expect(screen.getByText('1x Agua (20L)')).toBeInTheDocument();
    });

    it('debería manejar array de ítems vacío', () => {
      const sales = [
        createMockSale({ items: [] }),
      ];

      render(<SalesList sales={sales} />);

      expect(screen.getByTestId('total-sales')).toHaveTextContent('Bs 100.00');
    });

    it('debería manejar ítems undefined', () => {
      const sales = [
        createMockSale({ items: undefined as any }),
      ];

      render(<SalesList sales={sales} />);

      expect(screen.getByTestId('total-sales')).toHaveTextContent('Bs 100.00');
    });

    it('debería mostrar notas cuando existen', () => {
      const sales = [
        createMockSale({ notes: 'Nota especial del cliente' }),
      ];

      render(<SalesList sales={sales} />);

      expect(screen.getByText('Nota especial del cliente')).toBeInTheDocument();
    });

    it('debería no mostrar notas cuando no existen', () => {
      const sales = [
        createMockSale({ notes: undefined }),
      ];

      render(<SalesList sales={sales} />);

      const notesElement = screen.queryByText(/Nota/);
      expect(notesElement).not.toBeInTheDocument();
    });
  });

  describe('Iconos de método de pago', () => {
    it('debería mostrar icono correcto para cada método de pago', () => {
      const sales = [
        createMockSale({ paymentMethod: 'pago_movil' }),
        createMockSale({ id: 'sale-2', paymentMethod: 'efectivo' }),
        createMockSale({ id: 'sale-3', paymentMethod: 'punto_venta' }),
        createMockSale({ id: 'sale-4', paymentMethod: 'divisa' }),
      ];

      render(<SalesList sales={sales} />);

      expect(screen.getAllByTestId('smartphone-icon')).toHaveLength(1);
      expect(screen.getAllByTestId('banknote-icon')).toHaveLength(1);
      expect(screen.getAllByTestId('credit-card-icon')).toHaveLength(1);
      expect(screen.getAllByTestId('dollar-sign-icon')).toHaveLength(1);
    });

    it('debería usar icono por defecto para método de pago desconocido', () => {
      const sales = [
        createMockSale({ paymentMethod: 'unknown' as any }),
      ];

      render(<SalesList sales={sales} />);

      expect(screen.getAllByTestId('banknote-icon')).toHaveLength(1);
    });
  });

  describe('Formateo de tiempo', () => {
    it('debería mostrar tiempo correctamente', () => {
      const sales = [
        createMockSale({ createdAt: '2024-01-15T14:30:00Z' }),
      ];

      render(<SalesList sales={sales} />);

      expect(screen.getByText(/10:30/)).toBeInTheDocument();
    });
  });

  describe('Interacciones - Eliminar venta', () => {
    it('debería confirmar eliminación y llamar a deleteSale', async () => {
      const sales = [createMockSale()];

      render(<SalesList sales={sales} />);

      fireEvent.click(screen.getByTestId('trash-icon'));

      const deleteButton = screen.getByText('Eliminar');
      fireEvent.click(deleteButton);

      expect(mockDeleteSale).toHaveBeenCalledWith('sale-1');
      expect(mockToast.success).toHaveBeenCalledWith('Venta eliminada');
    });

    it('debería cancelar eliminación', () => {
      const sales = [createMockSale()];

      render(<SalesList sales={sales} />);

      fireEvent.click(screen.getByTestId('trash-icon'));

      const cancelButton = screen.getByText('Cancelar');
      fireEvent.click(cancelButton);

      expect(mockDeleteSale).not.toHaveBeenCalled();
    });
  });

  describe('Interacciones - Editar venta', () => {
    it('debería abrir sheet de edición al hacer clic en editar', () => {
      const sales = [createMockSale()];

      render(<SalesList sales={sales} />);

      expect(screen.queryByTestId('edit-sale-sheet')).not.toBeInTheDocument();

      fireEvent.click(screen.getByTestId('pencil-icon'));

      expect(screen.getByTestId('edit-sale-sheet')).toBeInTheDocument();
      expect(screen.getByTestId('editing-sale-id')).toHaveTextContent('sale-1');
    });

    it('debería cerrar sheet de edición', () => {
      const sales = [createMockSale()];

      render(<SalesList sales={sales} />);

      fireEvent.click(screen.getByTestId('pencil-icon'));
      fireEvent.click(screen.getByText('Close'));

      expect(screen.queryByTestId('edit-sale-sheet')).not.toBeInTheDocument();
    });
  });

  describe('Casos límite y edge cases', () => {
    it('debería manejar dailyNumber undefined', () => {
      const sales = [
        createMockSale({ dailyNumber: undefined }),
      ];

      render(<SalesList sales={sales} />);

      expect(screen.getByText('#-')).toBeInTheDocument();
    });

    it('debería manejar dailyNumber null', () => {
      const sales = [
        createMockSale({ dailyNumber: null as any }),
      ];

      render(<SalesList sales={sales} />);

      expect(screen.getByText('#-')).toBeInTheDocument();
    });

    it('debería manejar venta con todos los campos undefined', () => {
      const minimalSale: Sale = {
        id: 'minimal-sale',
        dailyNumber: 0,
        date: '',
        items: [],
        paymentMethod: 'efectivo',
        totalBs: 0,
        totalUsd: 0,
        exchangeRate: 0,
        createdAt: '',
        updatedAt: '',
      };

      render(<SalesList sales={[minimalSale]} />);

      expect(screen.getByTestId('sale-price-minimal-sale')).toHaveTextContent('Bs 0.00');
    });

    it('debería manejar array de ventas null', () => {
      expect(() => {
        render(<SalesList sales={null as any} />);
      }).toThrow();
    });

    it('debería manejar array de ventas undefined', () => {
      expect(() => {
        render(<SalesList sales={undefined as any} />);
      }).toThrow();
    });
  });

  describe('Performance y renderizado masivo', () => {
    it('debería manejar gran cantidad de ventas', () => {
      const sales = Array.from({ length: 100 }, (_, i) =>
        createMockSale({
          id: `sale-${i}`,
          dailyNumber: i + 1,
          totalBs: (i + 1) * 10,
        })
      );

      render(<SalesList sales={sales} />);

      expect(screen.getByText('Ventas del Día (100)')).toBeInTheDocument();
      expect(screen.getByTestId('total-sales')).toHaveTextContent('Bs 50500.00');
    });
  });

  describe('Accesibilidad', () => {
    it('debería tener botones con roles apropiados', () => {
      const sales = [createMockSale()];

      render(<SalesList sales={sales} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('debería mostrar información estructurada', () => {
      const sales = [createMockSale()];

      render(<SalesList sales={sales} />);

      expect(screen.getByRole('heading', { name: /Ventas del Día/ })).toBeInTheDocument();
    });
  });
});

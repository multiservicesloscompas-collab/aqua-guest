import '@testing-library/jest-dom';

// Mock de lucide-react icons
vi.mock('lucide-react', () => ({
  Trash2: () => 'trash-icon',
  Smartphone: () => 'smartphone-icon',
  Banknote: () => 'banknote-icon',
  CreditCard: () => 'credit-card-icon',
  FileText: () => 'file-text-icon',
  Pencil: () => 'pencil-icon',
  DollarSign: () => 'dollar-sign-icon',
}));

// Mock de sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

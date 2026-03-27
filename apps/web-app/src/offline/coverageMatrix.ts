export type OfflineMutationContract =
  | 'read-sync-only'
  | 'offline-mutation-enabled';

export interface OfflineTableCoveragePolicy {
  table: string;
  domain: string;
  mutationContract: OfflineMutationContract;
  queueReconcileRequirement: string;
  dependencyGroup: string;
}

export const OFFLINE_COVERAGE_MATRIX: OfflineTableCoveragePolicy[] = [
  {
    table: 'companies',
    domain: 'tenant/platform',
    mutationContract: 'read-sync-only',
    queueReconcileRequirement: 'refresh-on-reconnect',
    dependencyGroup: 'root-tenant-context',
  },
  {
    table: 'user_profiles',
    domain: 'identity',
    mutationContract: 'read-sync-only',
    queueReconcileRequirement: 'refresh-on-reconnect',
    dependencyGroup: 'root-user-context',
  },
  {
    table: 'customers',
    domain: 'customers',
    mutationContract: 'offline-mutation-enabled',
    queueReconcileRequirement: 'queue-create-update-delete',
    dependencyGroup: 'customer-root',
  },
  {
    table: 'products',
    domain: 'water-sales/catalog',
    mutationContract: 'read-sync-only',
    queueReconcileRequirement: 'refresh-on-reconnect',
    dependencyGroup: 'product-root',
  },
  {
    table: 'sales',
    domain: 'water-sales',
    mutationContract: 'offline-mutation-enabled',
    queueReconcileRequirement: 'queue-create-update-delete',
    dependencyGroup: 'sales-root',
  },
  {
    table: 'sale_payment_splits',
    domain: 'water-sales/payments',
    mutationContract: 'offline-mutation-enabled',
    queueReconcileRequirement: 'queue-dependent-on-sales',
    dependencyGroup: 'sales-payment-splits-child',
  },
  {
    table: 'washer_rentals',
    domain: 'rentals',
    mutationContract: 'offline-mutation-enabled',
    queueReconcileRequirement: 'queue-create-update-delete',
    dependencyGroup: 'rental-root',
  },
  {
    table: 'rental_payment_splits',
    domain: 'rentals/payments',
    mutationContract: 'offline-mutation-enabled',
    queueReconcileRequirement: 'queue-dependent-on-rentals',
    dependencyGroup: 'rental-payment-splits-child',
  },
  {
    table: 'prepaid_orders',
    domain: 'prepaid',
    mutationContract: 'offline-mutation-enabled',
    queueReconcileRequirement: 'queue-create-update-delete',
    dependencyGroup: 'prepaid-root',
  },
  {
    table: 'expenses',
    domain: 'expenses',
    mutationContract: 'offline-mutation-enabled',
    queueReconcileRequirement: 'queue-create-update-delete',
    dependencyGroup: 'expense-root',
  },
  {
    table: 'expense_payment_splits',
    domain: 'expenses/payments',
    mutationContract: 'offline-mutation-enabled',
    queueReconcileRequirement: 'queue-dependent-on-expenses',
    dependencyGroup: 'expense-payment-splits-child',
  },
  {
    table: 'exchange_rates',
    domain: 'finance/config',
    mutationContract: 'offline-mutation-enabled',
    queueReconcileRequirement: 'queue-update',
    dependencyGroup: 'finance-config-root',
  },
  {
    table: 'liter_pricing',
    domain: 'finance/config',
    mutationContract: 'offline-mutation-enabled',
    queueReconcileRequirement: 'queue-update',
    dependencyGroup: 'finance-config-root',
  },
  {
    table: 'washing_machines',
    domain: 'machines',
    mutationContract: 'offline-mutation-enabled',
    queueReconcileRequirement: 'queue-create-update-delete',
    dependencyGroup: 'machine-root',
  },
  {
    table: 'payment_balance_transactions',
    domain: 'payment-balance',
    mutationContract: 'offline-mutation-enabled',
    queueReconcileRequirement: 'queue-create-update-delete',
    dependencyGroup: 'payment-balance-root',
  },
];

export const OFFLINE_MUTATION_TABLES = OFFLINE_COVERAGE_MATRIX.filter(
  (entry) => entry.mutationContract === 'offline-mutation-enabled'
).map((entry) => entry.table);

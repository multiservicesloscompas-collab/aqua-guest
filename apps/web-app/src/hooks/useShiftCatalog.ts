import {
  selectShiftCatalog,
  useRentalShiftStore,
} from '@/store/useRentalShiftStore';

export function useShiftCatalog() {
  return useRentalShiftStore(selectShiftCatalog);
}

/**
 * Servicio de filtrado de ventas - OCP: Open/Closed Principle
 * Abierto para extensión, cerrado para modificación
 */

import { Sale } from '@/types';
import { IDateService } from './DateService';

export interface ISalesFilterStrategy {
  filter(sales: Sale[], date: string): Sale[];
}

export class DateFilterStrategy implements ISalesFilterStrategy {
  constructor(private dateService: IDateService) {}

  filter(sales: Sale[], date: string): Sale[] {
    return sales.filter(sale => 
      this.dateService.isSameDate(sale.date, date)
    );
  }
}

export class SalesFilterService {
  constructor(private filterStrategy: ISalesFilterStrategy) {}

  filterSales(sales: Sale[], date: string): Sale[] {
    return this.filterStrategy.filter(sales, date);
  }
}

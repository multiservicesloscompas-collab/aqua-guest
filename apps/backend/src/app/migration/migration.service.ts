import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '../clients/entities/client.entity';
import { Sale } from '../sales/entities/sale.entity';
import { SaleProduct } from '../sales/entities/sale-product.entity';
import { Rental } from '../rentals/entities/rental.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { RecurringExpense } from '../expenses/entities/recurring-expense.entity';
import { Rate } from '../rates/entities/rate.entity';
import { ImportDataDto } from './dto/import-data.dto';

@Injectable()
export class MigrationService {
  constructor(
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(Sale)
    private saleRepository: Repository<Sale>,
    @InjectRepository(SaleProduct)
    private saleProductRepository: Repository<SaleProduct>,
    @InjectRepository(Rental)
    private rentalRepository: Repository<Rental>,
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
    @InjectRepository(RecurringExpense)
    private recurringExpenseRepository: Repository<RecurringExpense>,
    @InjectRepository(Rate)
    private rateRepository: Repository<Rate>,
  ) {}

  async importData(data: ImportDataDto) {
    const results = {
      clients: 0,
      sales: 0,
      saleProducts: 0,
      rentals: 0,
      expenses: 0,
      recurringExpenses: 0,
      rates: 0,
    };

    try {
      // Import clients
      if (data.clients && data.clients.length > 0) {
        await this.clientRepository.save(data.clients);
        results.clients = data.clients.length;
      }
    } catch (error) {
      console.error('Error importing clients:', error);
      throw new Error(`Failed to import clients: ${error.message}`);
    }

    try {
      // Import rates
      if (data.rates && data.rates.length > 0) {
        await this.rateRepository.save(data.rates);
        results.rates = data.rates.length;
      }
    } catch (error) {
      console.error('Error importing rates:', error);
      throw new Error(`Failed to import rates: ${error.message}`);
    }

    try {
      // Import recurring expenses
      if (data.recurringExpenses && data.recurringExpenses.length > 0) {
        await this.recurringExpenseRepository.save(data.recurringExpenses);
        results.recurringExpenses = data.recurringExpenses.length;
      }
    } catch (error) {
      console.error('Error importing recurring expenses:', error);
      throw new Error(`Failed to import recurring expenses: ${error.message}`);
    }

    try {
      // Import expenses
      if (data.expenses && data.expenses.length > 0) {
        await this.expenseRepository.save(data.expenses);
        results.expenses = data.expenses.length;
      }
    } catch (error) {
      console.error('Error importing expenses:', error);
      throw new Error(`Failed to import expenses: ${error.message}`);
    }

    try {
      // Import sales
      if (data.sales && data.sales.length > 0) {
        await this.saleRepository.save(data.sales);
        results.sales = data.sales.length;
      }
    } catch (error) {
      console.error('Error importing sales:', error);
      throw new Error(`Failed to import sales: ${error.message}`);
    }

    try {
      // Import sale products (link them to sales by tempId)
      if (data.saleProducts && data.saleProducts.length > 0) {
        // First, get all sales to create a lookup map by tempId
        const allSales = await this.saleRepository.find();
        const salesMap = new Map();
        allSales.forEach((sale) => {
          if (sale.tempId) {
            salesMap.set(sale.tempId, sale.id);
          }
        });

        // Link products to sales
        const linkedProducts = data.saleProducts.map((product) => {
          const saleId = salesMap.get(product.saleTempId);
          if (saleId) {
            return {
              ...product,
              sale_id: saleId,
              // Remove temporary fields
              saleTempId: undefined,
            };
          }
          // If no match found, save without sale_id (nullable)
          return {
            ...product,
            saleTempId: undefined,
          };
        });

        await this.saleProductRepository.save(linkedProducts);
        results.saleProducts = data.saleProducts.length;
      }
    } catch (error) {
      console.error('Error importing sale products:', error);
      throw new Error(`Failed to import sale products: ${error.message}`);
    }

    try {
      // Import rentals
      if (data.rentals && data.rentals.length > 0) {
        await this.rentalRepository.save(data.rentals);
        results.rentals = data.rentals.length;
      }
    } catch (error) {
      console.error('Error importing rentals:', error);
      throw new Error(`Failed to import rentals: ${error.message}`);
    }

    return {
      success: true,
      message: 'Data imported successfully',
      results,
    };
  }
}

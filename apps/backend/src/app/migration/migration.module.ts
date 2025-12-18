import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MigrationService } from './migration.service';
import { MigrationController } from './migration.controller';
import { Client } from '../clients/entities/client.entity';
import { Sale } from '../sales/entities/sale.entity';
import { SaleProduct } from '../sales/entities/sale-product.entity';
import { Rental } from '../rentals/entities/rental.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { RecurringExpense } from '../expenses/entities/recurring-expense.entity';
import { Rate } from '../rates/entities/rate.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Client,
      Sale,
      SaleProduct,
      Rental,
      Expense,
      RecurringExpense,
      Rate,
    ]),
  ],
  controllers: [MigrationController],
  providers: [MigrationService],
})
export class MigrationModule {}

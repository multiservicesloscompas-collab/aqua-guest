import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpensesService } from './expenses.service';
import { ExpensesController } from './expenses.controller';
import { Expense } from './entities/expense.entity';
import { RecurringExpense } from './entities/recurring-expense.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Expense, RecurringExpense])],
  controllers: [ExpensesController],
  providers: [ExpensesService],
})
export class ExpensesModule {}

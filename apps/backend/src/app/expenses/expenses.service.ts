import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { CreateRecurringExpenseDto } from './dto/create-recurring-expense.dto';
import { Expense } from './entities/expense.entity';
import { RecurringExpense } from './entities/recurring-expense.entity';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
    @InjectRepository(RecurringExpense)
    private recurringExpenseRepository: Repository<RecurringExpense>,
  ) {}

  create(createExpenseDto: CreateExpenseDto) {
    const expense = this.expenseRepository.create(createExpenseDto);
    return this.expenseRepository.save(expense);
  }

  findAll() {
    return this.expenseRepository.find();
  }

  findOne(id: string) {
    return this.expenseRepository.findOneBy({ id });
  }

  update(id: string, updateExpenseDto: UpdateExpenseDto) {
    return this.expenseRepository.update(id, updateExpenseDto);
  }

  remove(id: string) {
    return this.expenseRepository.delete(id);
  }

  // Recurring Expenses
  createRecurring(createRecurringExpenseDto: CreateRecurringExpenseDto) {
    const expense = this.recurringExpenseRepository.create(
      createRecurringExpenseDto,
    );
    return this.recurringExpenseRepository.save(expense);
  }

  findAllRecurring() {
    return this.recurringExpenseRepository.find();
  }

  removeRecurring(id: string) {
    return this.recurringExpenseRepository.delete(id);
  }
}

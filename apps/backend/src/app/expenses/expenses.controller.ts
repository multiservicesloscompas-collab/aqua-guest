import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { CreateRecurringExpenseDto } from './dto/create-recurring-expense.dto';

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  create(@Body() createExpenseDto: CreateExpenseDto) {
    return this.expensesService.create(createExpenseDto);
  }

  @Get()
  findAll() {
    return this.expensesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.expensesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateExpenseDto: UpdateExpenseDto) {
    return this.expensesService.update(id, updateExpenseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.expensesService.remove(id);
  }

  @Post('recurring')
  createRecurring(
    @Body() createRecurringExpenseDto: CreateRecurringExpenseDto,
  ) {
    return this.expensesService.createRecurring(createRecurringExpenseDto);
  }

  @Get('recurring/all')
  findAllRecurring() {
    return this.expensesService.findAllRecurring();
  }

  @Delete('recurring/:id')
  removeRecurring(@Param('id') id: string) {
    return this.expensesService.removeRecurring(id);
  }
}

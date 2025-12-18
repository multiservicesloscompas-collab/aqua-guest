import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateExpenseDto {
  @IsString()
  createdAt: string;

  @IsString()
  name: string;

  @IsString()
  expenseDate: string;

  @IsNumber()
  amountBs: number;

  @IsNumber()
  amountUsd: number;

  @IsString()
  category: string;

  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  exchangeRate: number;
}

import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateRecurringExpenseDto {
  @IsString()
  name: string;

  @IsNumber()
  amountBs: number;

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  description?: string;
}

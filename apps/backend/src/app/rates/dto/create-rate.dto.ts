import { IsString, IsNumber } from 'class-validator';

export class CreateRateDto {
  @IsString()
  date: string;

  @IsNumber()
  usd: number;

  @IsNumber()
  eur: number;
}

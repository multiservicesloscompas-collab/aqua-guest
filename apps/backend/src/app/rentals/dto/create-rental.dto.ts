import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateRentalDto {
  @IsString()
  date: string;

  @IsString()
  deliveryDatetime: string;

  @IsString()
  pickupDatetime: string;

  @IsString()
  promo: string;

  @IsNumber()
  machineId: number;

  @IsNumber()
  deliveryDollars: number;

  @IsNumber()
  deliveryBs: number;

  @IsString()
  paymentMethod: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsString()
  status: string;

  @IsString()
  paymentStatus: string;

  @IsNumber()
  pricePerUnit: number;

  @IsNumber()
  totalBs: number;

  @IsNumber()
  totalUsd: number;

  @IsNumber()
  exchangeRate: number;

  @IsOptional()
  @IsString()
  clientId?: string;
}

import {
  IsString,
  IsNumber,
  IsOptional,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

class CreateSaleProductDto {
  @IsNumber()
  quantity: number;

  @IsNumber()
  liters: number;

  @IsString()
  productType: string;

  @IsNumber()
  pricePerUnit: number;

  @IsNumber()
  totalBs: number;

  @IsNumber()
  totalUsd: number;
}

export class CreateSaleDto {
  @IsString()
  date: string;

  @IsString()
  paymentMethod: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsNumber()
  totalBs: number;

  @IsNumber()
  totalUsd: number;

  @IsNumber()
  exchangeRate: number;

  @IsOptional()
  @IsString()
  tempId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleProductDto)
  products: CreateSaleProductDto[];
}

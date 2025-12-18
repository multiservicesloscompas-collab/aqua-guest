import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { Sale } from './entities/sale.entity';
import { SaleProduct } from './entities/sale-product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Sale, SaleProduct])],
  controllers: [SalesController],
  providers: [SalesService],
})
export class SalesModule {}

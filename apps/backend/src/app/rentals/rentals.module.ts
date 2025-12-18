import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RentalsService } from './rentals.service';
import { RentalsController } from './rentals.controller';
import { Rental } from './entities/rental.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Rental])],
  controllers: [RentalsController],
  providers: [RentalsService],
})
export class RentalsModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RatesModule } from './app/rates/rates.module';
import { SalesModule } from './app/sales/sales.module';
import { ClientsModule } from './app/clients/clients.module';
import { RentalsModule } from './app/rentals/rentals.module';
import { ExpensesModule } from './app/expenses/expenses.module';
import { MigrationModule } from './app/migration/migration.module';

const TypeOrmModuleConfig = TypeOrmModule.forRoot({
  type: 'sqlite',
  database: 'database.sqlite',
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  synchronize: true,
});

@Module({
  imports: [
    TypeOrmModuleConfig,

    ClientsModule,
    SalesModule,
    RentalsModule,
    ExpensesModule,
    RatesModule,
    MigrationModule,
  ],
})
export class AppModule {}

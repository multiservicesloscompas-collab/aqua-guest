import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../libs/typeorm/base-entity';

@Entity('expenses')
export class Expense extends BaseEntity {
  @Column()
  name: string;

  @Column({ name: 'expense_date' })
  expenseDate: string;

  @Column({ name: 'amount_bs', type: 'decimal' })
  amountBs: number;

  @Column({ name: 'amount_usd', type: 'decimal' })
  amountUsd: number;

  @Column()
  category: string;

  @Column()
  type: string;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'exchange_rate', type: 'decimal' })
  exchangeRate: number;
}

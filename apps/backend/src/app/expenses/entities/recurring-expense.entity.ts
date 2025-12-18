import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../libs/typeorm/base-entity';

@Entity('recurring_expenses')
export class RecurringExpense extends BaseEntity {
  @Column()
  name: string;

  @Column({ name: 'amount_bs', type: 'decimal' })
  amountBs: number;

  @Column()
  category: string;

  @Column({ nullable: true })
  description?: string;
}

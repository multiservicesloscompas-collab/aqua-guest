import { Entity, Column, OneToMany } from 'typeorm';
import { SaleProduct } from './sale-product.entity';
import { BaseEntity } from '../../../libs/typeorm/base-entity';

@Entity('sales')
export class Sale extends BaseEntity {
  @Column()
  date: string;

  @Column({ name: 'payment_method' })
  paymentMethod: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ name: 'total_bs', type: 'decimal' })
  totalBs: number;

  @Column({ name: 'total_usd', type: 'decimal' })
  totalUsd: number;

  @Column({ name: 'exchange_rate', type: 'decimal' })
  exchangeRate: number;

  @Column({ nullable: true })
  tempId: string;

  @OneToMany(() => SaleProduct, (product) => product.sale, { cascade: true })
  products: SaleProduct[];
}

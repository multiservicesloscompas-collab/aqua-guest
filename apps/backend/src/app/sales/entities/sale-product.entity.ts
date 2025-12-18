import { Entity, Column, ManyToOne, RelationId } from 'typeorm';
import { Sale } from './sale.entity';
import { BaseEntity } from '../../../libs/typeorm/base-entity';

@Entity('sale_products')
export class SaleProduct extends BaseEntity {
  @Column()
  quantity: number;

  @Column()
  liters: number;

  @Column({ name: 'product_type' })
  productType: string;

  @Column({ name: 'price_per_unit', type: 'decimal' })
  pricePerUnit: number;

  @Column({ name: 'total_bs', type: 'decimal' })
  totalBs: number;

  @Column({ name: 'total_usd', type: 'decimal' })
  totalUsd: number;

  @RelationId((post: SaleProduct) => post.sale) // you need to specify target relation
  @Column({ name: 'sale_id', nullable: true })
  sale_id: string;

  // Relations
  @ManyToOne(() => Sale, (sale) => sale.products, { onDelete: 'CASCADE' })
  sale: Sale;
}

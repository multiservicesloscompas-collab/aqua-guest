import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../libs/typeorm/base-entity';

@Entity('washer_rentals')
export class Rental extends BaseEntity {
  @Column({ nullable: true })
  date: string;

  @Column({ name: 'delivery_datetime' })
  deliveryDatetime: string;

  @Column({ name: 'pickup_datetime' })
  pickupDatetime: string;

  @Column()
  promo: string;

  @Column({ name: 'machine_id' })
  machineId: number;

  @Column({ name: 'delivery_dollars', type: 'decimal' })
  deliveryDollars: number;

  @Column({ name: 'delivery_bs', type: 'decimal' })
  deliveryBs: number;

  @Column({ name: 'payment_method' })
  paymentMethod: string;

  @Column({ nullable: true })
  notes: string;

  @Column()
  status: string;

  @Column({ name: 'payment_status' })
  paymentStatus: string;

  @Column({ name: 'is_paid', default: false })
  isPaid: boolean;

  @Column({ name: 'date_paid', nullable: true })
  datePaid: string;

  @Column({ name: 'price_per_unit', type: 'decimal' })
  pricePerUnit: number;

  @Column({ name: 'total_bs', type: 'decimal' })
  totalBs: number;

  @Column({ name: 'total_usd', type: 'decimal' })
  totalUsd: number;

  @Column({ name: 'exchange_rate', type: 'decimal' })
  exchangeRate: number;

  @Column({ name: 'client_id', nullable: true })
  clientId: string;
}

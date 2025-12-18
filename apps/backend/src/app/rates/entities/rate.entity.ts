import { Entity, Column, Unique } from 'typeorm';
import { BaseEntity } from '../../../libs/typeorm/base-entity';

@Entity('rates')
@Unique(['date'])
export class Rate extends BaseEntity {
  @Column()
  date: string;

  @Column('decimal')
  usd: number;

  @Column('decimal')
  eur: number;
}

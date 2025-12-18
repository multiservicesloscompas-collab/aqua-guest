import { Entity, Column } from 'typeorm';

import { BaseEntity } from '../../../libs/typeorm/base-entity';

@Entity('clients')
export class Client extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;
}

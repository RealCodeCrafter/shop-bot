import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Order } from '../order/order.entity';
import { DELIVERY_STATUS } from '../../common/constants';

@Entity()
export class Delivery {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Order, (order) => order.deliveries, { onDelete: 'CASCADE' })
  order: Order;

  @Column()
  address: string;

  @Column({ nullable: true })
  deliveryDate: Date;

  @Column({ type: 'enum', enum: DELIVERY_STATUS, default: DELIVERY_STATUS.PENDING })
  status: typeof DELIVERY_STATUS[keyof typeof DELIVERY_STATUS];

  @Column({ nullable: true })
  trackingNumber: string;

  @Column()
  createdAt: Date;

  @Column({ nullable: true })
  updatedAt: Date;
}
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Order } from '../order/order.entity';
import { Cart } from '../cart/cart.entity';
import { Feedback } from '../feedback/feedback.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  telegramId: string;

  @Column()
  fullName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ default: false })
  isAdmin: boolean;

  @Column()
  createdAt: Date;

  @OneToMany(() => Order, (order) => order.user, { cascade: true })
  orders: Order[];

  @OneToMany(() => Cart, (cart) => cart.user, { cascade: true })
  cartItems: Cart[];

  @OneToMany(() => Feedback, (feedback) => feedback.user, { cascade: true })
  feedbacks: Feedback[];
}
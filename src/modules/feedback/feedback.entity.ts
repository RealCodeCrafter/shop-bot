import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { User } from '../user/user.entity';
import { Product } from '../product/product.entity';

@Entity("telegramFeedback")
export class Feedback {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.feedbacks, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Product, (product) => product.feedbacks, { onDelete: 'CASCADE' })
  product: Product;

  @Column()
  rating: number;

  @Column()
  comment: string;

  @Column()
  createdAt: Date;
}
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../modules/user/user.entity';
import { Category } from '../modules/category/category.entity';
import { Product } from '../modules/product/product.entity';
import { Cart } from '../modules/cart/cart.entity';
import { Order } from '../modules/order/order.entity';
import { OrderItem } from '../modules/order/order-item.entity';
import { Feedback } from '../modules/feedback/feedback.entity';
import { Promocode } from '../modules/promocode/promocode.entity';
import { Payment } from '../modules/payment/payment.entity';
import * as dotenv from 'dotenv';
dotenv.config();


export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, Category, Product, Cart, Order, OrderItem, Feedback, Promocode, Payment],
  migrations: ['dist/migrations/*.js'],
  synchronize: false,
  migrationsRun: true,
  ssl: {
    rejectUnauthorized: false,
  },
};
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

export const databaseConfig: TypeOrmModuleOptions = {
    type: 'postgres',
    host: 'switchback.proxy.rlwy.net',
    port: 12532,
    username: 'postgres',
    password: 'kzkKIsLBmILciwKoRmbLdZPtQawOsheO',
    database: 'railway',
    autoLoadEntities: true,
    ssl: {
      rejectUnauthorized: false,
    },
  entities: [User, Category, Product, Cart, Order, OrderItem, Feedback, Promocode, Payment],
  synchronize: true,
  migrations: ['src/migrations/*.ts'],
  migrationsRun: true,
};
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from './modules/user/user.module';
import { CategoryModule } from './modules/category/category.module';
import { ProductModule } from './modules/product/product.module';
import { CartModule } from './modules/cart/cart.module';
import { OrderModule } from './modules/order/order.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { PaymentModule } from './modules/payment/payment.module';
import { PromocodeModule } from './modules/promocode/promocode.module';
import { TelegramModule } from './modules/telegram/telegram.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
     ConfigModule.forRoot({ envFilePath: '.env', isGlobal: true }),
    CacheModule.register({ isGlobal: true }),
    TypeOrmModule.forRoot({
    type: 'postgres',
    host: 'switchback.proxy.rlwy.net',
    port: 12532,
    username: 'postgres',
    password: 'kzkKIsLBmILciwKoRmbLdZPtQawOsheO',
    database: 'railway',
    autoLoadEntities: true,
    synchronize: false,
    ssl: {
      rejectUnauthorized: false,
    },
  }),

    UserModule,
    CategoryModule,
    ProductModule,
    CartModule,
    OrderModule,
    FeedbackModule,
    PaymentModule,
    PromocodeModule,
    TelegramModule,
  ],
})
export class AppModule {}
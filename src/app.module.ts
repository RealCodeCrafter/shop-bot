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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL') || "postgres://postgres:kzkKIsLBmILciwKoRmbLdZPtQawOsheO@switchback.proxy.rlwy.net:12532/railway",
        entities: ['dist/**/*.entity{.ts,.js}'],
        migrations: ['dist/migrations/*{.ts,.js}'],
        synchronize: false,
        migrationsRun: false,
        ssl: {
          rejectUnauthorized: false,
        },
        poolSize: 10,
        connectionTimeoutMillis: 10000,
        maxQueryExecutionTime: 5000,
      }),
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
import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { UserModule } from '../user/user.module';
import { CategoryModule } from '../category/category.module';
import { ProductModule } from '../product/product.module';
import { CartModule } from '../cart/cart.module';
import { OrderModule } from '../order/order.module';
import { FeedbackModule } from '../feedback/feedback.module';
import { PromocodeModule } from '../promocode/promocode.module';
import { PaymentModule } from '../payment/payment.module';
import { StartHandler } from './handlers/start.handler';
import { ContactHandler } from './handlers/contact.handler';
import { CategoriesHandler } from './handlers/categories.handler';
import { CartHandler } from './handlers/cart.handler';
import { HelpHandler } from './handlers/help.handler';
import { AdminHandler } from './handlers/admin.handler';
import { CallbackHandler } from './handlers/callback.handler';
import { ConfigModule } from '@nestjs/config';
import { TelegramController } from './telegram.controller';

@Module({
  imports: [
    ConfigModule,
    UserModule,
    CategoryModule,
    ProductModule,
    CartModule,
    OrderModule,
    FeedbackModule,
    PromocodeModule,
    PaymentModule,
  ],
  providers: [
    TelegramService,
    StartHandler,
    ContactHandler,
    CategoriesHandler,
    CartHandler,
    HelpHandler,
    AdminHandler,
    CallbackHandler,
  ],
  controllers: [TelegramController],
  exports: [TelegramService],
})
export class TelegramModule {}
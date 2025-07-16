import { Module } from '@nestjs/common';
import { TelegramController } from './telegram.controller';

@Module({
  controllers: [TelegramController],
})
export class TelegramModule {}




// import { Module } from '@nestjs/common';
// import { TelegramService } from './telegram.service';
// import { TelegramController } from './telegram.controller';
// import { UserModule } from '../user/user.module';
// import { CategoryModule } from '../category/category.module';
// import { ProductModule } from '../product/product.module';
// import { CartModule } from '../cart/cart.module';
// import { OrderModule } from '../order/order.module';
// import { FeedbackModule } from '../feedback/feedback.module';
// import { PromocodeModule } from '../promocode/promocode.module';
// import { PaymentModule } from '../payment/payment.module';

// @Module({
//   imports: [UserModule, CategoryModule, ProductModule, CartModule, OrderModule, FeedbackModule, PromocodeModule, PaymentModule],
//   providers: [TelegramService],
//   controllers: [TelegramController],
// })
// export class TelegramModule {}
import { Module } from '@nestjs/common';
import { TelegramModule } from './modules/telegram/telegram.module';

@Module({
  imports: [TelegramModule],
})
export class AppModule {}
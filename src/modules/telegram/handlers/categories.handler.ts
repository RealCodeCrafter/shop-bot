import { Injectable, Logger } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import { CategoryService } from '../../category/category.service';

@Injectable()
export class CategoriesHandler {
  private logger = new Logger(CategoriesHandler.name);

  constructor(private categoryService: CategoryService) {}

  handle(bot: TelegramBot) {
    bot.onText(/📁 Kategoriyalar/, async (msg) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from.id.toString();
      try {
        this.logger.log(`Processing categories for telegramId: ${telegramId}`);
        const startTime = Date.now();
        const categories = await this.categoryService.findAll();
        const duration = Date.now() - startTime;
        this.logger.log(`Fetched ${categories.length} categories in ${duration}ms`);
        const keyboard = categories.map((cat) => [{ text: cat.name, callback_data: `category_${cat.id}` }]);
        await bot.sendMessage(chatId, 'Kategoriyalarni tanlang:', {
          reply_markup: { inline_keyboard: keyboard },
        });
      } catch (error) {
        this.logger.error(`Error in categories: ${error.message}`);
        await bot.sendMessage(chatId, 'Kategoriyalarni olishda xato yuz berdi.');
      }
    });
  }
}
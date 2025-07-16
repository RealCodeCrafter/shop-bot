import { Injectable, Logger } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import { UserService } from '../../user/user.service';
import { getAdminKeyboard } from '../utils/keyboards';

@Injectable()
export class AdminHandler {
  private logger = new Logger(AdminHandler.name);

  constructor(private userService: UserService) {}

  handle(bot: TelegramBot) {
    bot.onText(/\/admin/, async (msg) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from.id.toString();
      try {
        this.logger.log(`Processing /admin for telegramId: ${telegramId}`);
        const startTime = Date.now();
        const user = await this.userService.findByTelegramId(telegramId);
        const duration = Date.now() - startTime;
        this.logger.log(`User fetched in ${duration}ms`);
        if (!user || !user.isAdmin) {
          this.logger.warn(`Access denied for telegramId: ${telegramId}`);
          await bot.sendMessage(chatId, 'Sizda admin huquqlari yo‘q.');
          return;
        }
        await bot.sendMessage(chatId, 'Admin paneli', { reply_markup: getAdminKeyboard() });
      } catch (error) {
        this.logger.error(`Error in /admin: ${error.message}`);
        await bot.sendMessage(chatId, 'Admin panelni ochishda xato yuz berdi.');
      }
    });
  }
}
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import { UserService } from '../../user/user.service';
import { getMainKeyboard } from '../utils/keyboards';

@Injectable()
export class ContactHandler {
  private logger = new Logger(ContactHandler.name);

  constructor(private userService: UserService) {}

  handle(bot: TelegramBot) {
    bot.on('contact', async (msg) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from.id.toString();
      const phone = msg.contact.phone_number;
      this.logger.log(`Received phone for telegramId: ${telegramId}, phone: ${phone}`);
      try {
        const startTime = Date.now();
        await this.userService.updatePhoneNumber(telegramId, phone);
        const duration = Date.now() - startTime;
        this.logger.log(`Updated phone in ${duration}ms`);
        await bot.sendMessage(chatId, 'Telefon raqamingiz saqlandi! Endi do‘konimizdan bemalol foydalanishingiz mumkin.', {
          reply_markup: getMainKeyboard(false),
        });
      } catch (error) {
        this.logger.error(`Error saving phone for telegramId: ${telegramId}: ${error.message}`);
        if (error instanceof NotFoundException) {
          await bot.sendMessage(chatId, 'Foydalanuvchi topilmadi. Iltimos, /start buyrug‘i bilan qayta urinib ko‘ring.');
        } else {
          await bot.sendMessage(chatId, `Telefon raqamini saqlashda xato yuz berdi: ${error.message}.`);
        }
      }
    });
  }
}
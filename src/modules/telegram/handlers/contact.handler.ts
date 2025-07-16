import { Injectable, Logger } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import { TelegramService } from '../telegram.service';
import { getMainKeyboard } from '../utils/keyboards';

@Injectable()
export class ContactHandler {
  private logger = new Logger(ContactHandler.name);

  constructor(private telegramService: TelegramService) {}

  handle() {
    const bot = this.telegramService.getBotInstance();
    bot.on('contact', async (msg) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from.id.toString();
      const phone = msg.contact.phone_number;
      try {
        this.logger.log(`Processing contact for telegramId: ${telegramId}`);
        await this.telegramService.sendMessage(
          chatId,
          `Telefon raqamingiz qabul qilindi: ${phone}\nEndi do‘konimizdan bemalol foydalanishingiz mumkin!`,
          { reply_markup: getMainKeyboard(false) },
        );
      } catch (error) {
        this.logger.error(`Error in contact: ${error.message}`);
        await this.telegramService.sendMessage(chatId, 'Xatolik yuz berdi, iltimos keyinroq urinib ko‘ring.');
      }
    });
  }
}
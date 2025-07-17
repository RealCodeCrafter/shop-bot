import { Injectable, Logger } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import { TelegramService } from '../telegram.service';
import { UserService } from '../../user/user.service';
import { getMainKeyboard } from '../utils/keyboards';

@Injectable()
export class ContactHandler {
  private logger = new Logger(ContactHandler.name);

  constructor(
    private telegramService: TelegramService,
    private userService: UserService,
  ) {}

  handle() {
    const bot = this.telegramService.getBotInstance();

    bot.on('contact', async (msg) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from.id.toString();

      // Yangi: kontakt validatsiyasi
      if (!msg.contact || msg.contact.user_id !== msg.from.id) {
        this.logger.warn(`Noto‘g‘ri kontakt: ${JSON.stringify(msg.contact)}`);
        await this.telegramService.sendMessage(
          chatId,
          'Faqat o‘zingizning telefon raqamingizni ulashingiz mumkin. Iltimos, "Telefon raqamni yuborish" tugmasini bosing.',
          { reply_markup: getMainKeyboard(true) },
        );
        return;
      }

      const phone = msg.contact.phone_number;

      try {
        this.logger.log(`Telefon qabul qilindi: ${phone} telegramId: ${telegramId}`);

        await this.userService.updatePhoneNumber(telegramId, phone);

        await this.telegramService.sendMessage(
          chatId,
          `✅ Telefon raqamingiz saqlandi: ${phone}\nEndi do‘konimizdan bemalol foydalanishingiz mumkin!`,
          { reply_markup: getMainKeyboard(false) },
        );
      } catch (error) {
        this.logger.error(`Telefonni saqlashda xato: ${error.message}`);
        await this.telegramService.sendMessage(
          chatId,
          '❌ Telefon raqamingizni saqlashda xatolik yuz berdi. Iltimos, qayta urinib ko‘ring.',
        );
      }
    });
  }
}

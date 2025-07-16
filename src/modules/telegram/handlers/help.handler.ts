import { Injectable, Logger } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import { ADMIN_TELEGRAM_ID, ADMIN_TELEGRAM_USER } from '../utils/constants';
import { TelegramService } from '../telegram.service';

@Injectable()
export class HelpHandler {
  private logger = new Logger(HelpHandler.name);

  constructor(private telegramService: TelegramService) {}

  handle(bot: TelegramBot) {
    bot.onText(/🆘 Yordam/, async (msg) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from.id.toString();
      try {
        this.logger.log(`Processing help for telegramId: ${telegramId}`);
        await this.telegramService.sendMessage(chatId, `🆘 Yordam\nSavollaringiz bo‘lsa, admin bilan bog‘laning: @${ADMIN_TELEGRAM_USER}\nYoki xabar yozing:`, {
          reply_markup: { force_reply: true },
        });
        bot.once('message', async (replyMsg) => {
          const replyText = replyMsg.text;
          if (!replyText) {
            this.logger.log(`Ignoring empty help message from telegramId: ${telegramId}`);
            await this.telegramService.sendMessage(chatId, 'Iltimos, xabar yozing.');
            return;
          }
          try {
            await this.telegramService.sendChatAction(parseInt(ADMIN_TELEGRAM_ID), 'typing');
            await this.telegramService.sendMessage(parseInt(ADMIN_TELEGRAM_ID), `Yordam so‘rovi:\nFoydalanuvchi: ${replyMsg.from.id} (@${replyMsg.from.username || 'N/A'})\nXabar: ${replyText}`);
            await this.telegramService.sendMessage(chatId, `Sizning xabaringiz adminga (@${ADMIN_TELEGRAM_USER}) yuborildi. Tez orada javob olasiz!`);
          } catch (error) {
            this.logger.error(`Error sending help to admin: ${error.message}`);
            if (error.response?.body?.error_code === 403) {
              await this.telegramService.sendMessage(chatId, `Xabar yuborishda xato: Admin (@${ADMIN_TELEGRAM_USER}) bot bilan chat boshlamagan. Iltimos, @${ADMIN_TELEGRAM_USER} ga yozing.`);
            } else {
              await this.telegramService.sendMessage(chatId, `Xabar yuborishda xato: ${error.message}. Iltimos, @${ADMIN_TELEGRAM_USER} ga yozing.`);
            }
          }
        });
      } catch (error) {
        this.logger.error(`Error in help: ${error.message}`);
        await this.telegramService.sendMessage(chatId, `Yordam so‘rovida xato yuz berdi. Iltimos, @${ADMIN_TELEGRAM_USER} ga yozing.`);
      }
    });
  }
}
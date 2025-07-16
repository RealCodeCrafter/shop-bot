import { Injectable, Logger } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import { ConfigService } from '@nestjs/config';
import { TelegramService } from '../telegram.service';

@Injectable()
export class HelpHandler {
  private logger = new Logger(HelpHandler.name);

  constructor(
    private telegramService: TelegramService,
    private configService: ConfigService,
  ) {}

  handle() {
    const bot = this.telegramService.getBotInstance();
    const adminTelegramId = this.configService.get<number>('ADMIN_TELEGRAM_ID');
    const adminTelegramUser = this.configService.get<string>('ADMIN_TELEGRAM_USER');

    if (!adminTelegramId || !adminTelegramUser) {
      this.logger.error('ADMIN_TELEGRAM_ID or ADMIN_TELEGRAM_USER is not defined in .env file');
      throw new Error('ADMIN_TELEGRAM_ID or ADMIN_TELEGRAM_USER is not defined');
    }

    bot.onText(/🆘 Yordam/, async (msg) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from.id.toString();
      try {
        this.logger.log(`Processing help for telegramId: ${telegramId}`);
        await this.telegramService.sendMessage(
          chatId,
          `🆘 Yordam\nSavollaringiz bo‘lsa, admin bilan bog‘laning: @${adminTelegramUser}\nYoki xabar yozing:`,
          { reply_markup: { force_reply: true } },
        );
        bot.once('message', async (replyMsg) => {
          const replyText = replyMsg.text;
          if (!replyText) {
            this.logger.log(`Ignoring empty help message from telegramId: ${telegramId}`);
            await this.telegramService.sendMessage(chatId, 'Iltimos, xabar yozing.');
            return;
          }
          try {
            await this.telegramService.sendChatAction(adminTelegramId, 'typing');
            await this.telegramService.sendMessage(
              adminTelegramId,
              `Yordam so‘rovi:\nFoydalanuvchi: ${replyMsg.from.id} (@${replyMsg.from.username || 'N/A'})\nXabar: ${replyText}`,
            );
            await this.telegramService.sendMessage(
              chatId,
              `Sizning xabaringiz adminga (@${adminTelegramUser}) yuborildi. Tez orada javob olasiz!`,
            );
          } catch (error) {
            this.logger.error(`Error sending help to admin: ${error.message}`);
            if (error.response?.body?.error_code === 403) {
              await this.telegramService.sendMessage(
                chatId,
                `Xabar yuborishda xato: Admin (@${adminTelegramUser}) bot bilan chat boshlamagan. Iltimos, @${adminTelegramUser} ga yozing.`,
              );
            } else {
              await this.telegramService.sendMessage(
                chatId,
                `Xabar yuborishda xato: ${error.message}. Iltimos, @${adminTelegramUser} ga yozing.`,
              );
            }
          }
        });
      } catch (error) {
        this.logger.error(`Error in help: ${error.message}`);
        await this.telegramService.sendMessage(
          chatId,
          `Yordam so‘rovida xato yuz berdi. Iltimos, @${adminTelegramUser} ga yozing.`,
        );
      }
    });
  }
}
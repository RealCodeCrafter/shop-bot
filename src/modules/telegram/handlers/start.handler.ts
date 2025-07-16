import { Injectable, Logger } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import { UserService } from '../../user/user.service';
import { TelegramService } from '../telegram.service';
import { getMainKeyboard } from '../utils/keyboards';

@Injectable()
export class StartHandler {
  private logger = new Logger(StartHandler.name);

  constructor(
    private userService: UserService,
    private telegramService: TelegramService,
  ) {}

  handle() {
    const bot = this.telegramService.getBotInstance();
    bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id.toString();
  const fullName = `${msg.from.first_name} ${msg.from.last_name || ''}`.trim();

  this.logger.log(`Processing /start for telegramId: ${telegramId}`);
  const startTime = Date.now();

  try {
    await this.userService.registerUser({ telegramId, fullName });
    const user = await this.userService.findByTelegramId(telegramId);

    const duration = Date.now() - startTime;

    if (!user.phone) {
      this.logger.log(`User found but phone is missing in ${duration}ms`);
      await this.telegramService.sendMessage(
        chatId,
        `Xush kelibsiz, ${fullName}! Iltimos, telefon raqamingizni yuboring:`,
        { reply_markup: getMainKeyboard(true) },
      );
    } else {
      this.logger.log(`Existing user with phone in ${duration}ms`);
      await this.telegramService.sendMessage(
        chatId,
        `Qaytganingizdan xursandmiz, ${fullName}! 🛒 Do‘konimizdan bemalol foydalaning!`,
        { reply_markup: getMainKeyboard(false) },
      );
    }
  } catch (error) {
    this.logger.error(`Error in /start: ${error.message}`);
    await this.telegramService.sendMessage(chatId, 'Xatolik yuz berdi, iltimos keyinroq urinib ko‘ring.');
  }
});

}}
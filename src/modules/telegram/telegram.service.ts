import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import { StartHandler } from './handlers/start.handler';
import { ContactHandler } from './handlers/contact.handler';
import { CategoriesHandler } from './handlers/categories.handler';
import { CartHandler } from './handlers/cart.handler';
import { HelpHandler } from './handlers/help.handler';
import { AdminHandler } from './handlers/admin.handler';
import { CallbackHandler } from './handlers/callback.handler';
import { TELEGRAM_BOT_TOKEN, WEBHOOK_URL } from './utils/constants';

@Injectable()
export class TelegramService {
  private bot: TelegramBot;
  private logger = new Logger(TelegramService.name);

  constructor(
    @Inject(forwardRef(() => StartHandler))
    private startHandler: StartHandler,
    @Inject(forwardRef(() => ContactHandler))
    private contactHandler: ContactHandler,
    @Inject(forwardRef(() => CategoriesHandler))
    private categoriesHandler: CategoriesHandler,
    @Inject(forwardRef(() => CartHandler))
    private cartHandler: CartHandler,
    @Inject(forwardRef(() => HelpHandler))
    private helpHandler: HelpHandler,
    @Inject(forwardRef(() => AdminHandler))
    private adminHandler: AdminHandler,
    @Inject(forwardRef(() => CallbackHandler))
    private callbackHandler: CallbackHandler,
  ) {
    this.bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });
    this.setupWebhook();
    this.setupHandlers();
  }

  private async setupWebhook() {
    try {
      this.logger.log(`Setting webhook to ${WEBHOOK_URL}`);
      const startTime = Date.now();
      await this.bot.setWebHook(WEBHOOK_URL);
      const duration = Date.now() - startTime;
      this.logger.log(`Webhook set in ${duration}ms`);
    } catch (error) {
      this.logger.error(`Failed to set webhook: ${error.message}`);
      throw error;
    }
  }

  private setupHandlers() {
    this.startHandler.handle(this.bot);
    this.contactHandler.handle(this.bot);
    this.categoriesHandler.handle(this.bot);
    this.cartHandler.handle(this.bot);
    this.helpHandler.handle(this.bot);
    this.adminHandler.handle(this.bot);
    this.callbackHandler.handle(this.bot);
  }

  async handleWebhookUpdate(update: TelegramBot.Update) {
    try {
      const startTime = Date.now();
      await this.bot.processUpdate(update);
      const duration = Date.now() - startTime;
      this.logger.log(`Webhook update processed in ${duration}ms`);
    } catch (error) {
      this.logger.error(`Webhook update failed: ${error.message}`);
      throw error;
    }
  }

  async sendMessage(chatId: number, text: string, options?: TelegramBot.SendMessageOptions) {
    try {
      await this.bot.sendMessage(chatId, text, options);
    } catch (error) {
      this.logger.error(`Error sending message to chatId ${chatId}: ${error.message}`);
      throw error;
    }
  }

  async sendPhoto(chatId: number, photo: string, options?: TelegramBot.SendPhotoOptions) {
    try {
      await this.bot.sendPhoto(chatId, photo, options);
    } catch (error) {
      this.logger.error(`Error sending photo to chatId ${chatId}: ${error.message}`);
      throw error;
    }
  }

  async sendChatAction(chatId: string | number, action: TelegramBot.ChatAction) {
    try {
      await this.bot.sendChatAction(chatId, action);
    } catch (error) {
      this.logger.error(`Error sending chat action to chatId ${chatId}: ${error.message}`);
      throw error;
    }
  }
}
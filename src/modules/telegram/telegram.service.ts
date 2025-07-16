import { Injectable, Logger } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelegramService {
  private bot: TelegramBot;
  private logger = new Logger(TelegramService.name);

  constructor(private configService: ConfigService) {
    this.bot = new TelegramBot("7942071036:AAFz_o_p2p2o-Gq-1C1YZMQSdODCHJiu2dY", { polling: false });
    this.setupWebhook();
  }

  private async setupWebhook() {
    try {
      const webhookUrl = this.configService.get<string>('WEBHOOK_URL');
      this.logger.log(`Setting webhook to ${webhookUrl}`);
      const startTime = Date.now();
      await this.bot.setWebHook(webhookUrl);
      const duration = Date.now() - startTime;
      this.logger.log(`Webhook set in ${duration}ms`);
    } catch (error) {
      this.logger.error(`Failed to set webhook: ${error.message}`);
      throw error;
    }
  }

  getBotInstance(): TelegramBot {
    return this.bot;
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

  async sendMessage(chatId: any, text: string, options?: TelegramBot.SendMessageOptions) {
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

  async sendChatAction(chatId: any, action: TelegramBot.ChatAction) {
    try {
      await this.bot.sendChatAction(chatId, action);
    } catch (error) {
      this.logger.error(`Error sending chat action to chatId ${chatId}: ${error.message}`);
      throw error;
    }
  }
}
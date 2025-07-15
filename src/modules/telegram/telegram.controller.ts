import { Controller, Post, Body, Logger } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { ApiTags } from '@nestjs/swagger';
import * as TelegramBot from 'node-telegram-bot-api';

@ApiTags('telegram')
@Controller('telegram')
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);

  constructor(private readonly telegramService: TelegramService) {}

  @Post('webhook')
  async handleWebhook(@Body() update: TelegramBot.Update) {
    try {
      this.logger.log(`Received webhook update: ${JSON.stringify(update, null, 2)}`);
      await this.telegramService.handleWebhookUpdate(update);
      this.logger.log('Webhook update processed successfully');
      return { status: 'ok' };
    } catch (error) {
      this.logger.error(`Webhook processing failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}
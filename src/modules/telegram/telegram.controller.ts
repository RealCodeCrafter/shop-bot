import { Controller, Post, Get, Body, Logger } from '@nestjs/common';
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
    this.telegramService.handleWebhookUpdate(update)
      .then(() => this.logger.log('Webhook update processed successfully'))
      .catch((error) => this.logger.error(`Webhook update failed: ${error.message}`, error.stack));

    return { status: 'ok' };
  } catch (error) {
    this.logger.error(`Webhook processing failed: ${error.message}`, error.stack);
    throw error;
  }
}

  @Get('webhook')
  async getWebhookCheck() {
    this.logger.log('Received GET request on /telegram/webhook');
    return { status: 'Webhook is live' };
  }
}

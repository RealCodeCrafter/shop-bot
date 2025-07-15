import { Controller, Post, Body, Get, Logger } from '@nestjs/common';
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
  this.logger.log(`handleWebhook START: ${JSON.stringify(update, null, 2)}`);
  try {
    await this.telegramService.handleWebhookUpdate(update);
    this.logger.log('handleWebhook END: Success');
    return { status: 'ok' };
  } catch (error) {
    this.logger.error(`handleWebhook ERROR: ${error.message}`);
    throw error;
  }
}


  @Get('webhook')
  testWebhook() {
    this.logger.log('GET /telegram/webhook called');
    return { status: 'ok', message: 'Webhook GET endpoint is working' };
  }
}

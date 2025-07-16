// telegram.controller.ts
import { Controller, Post, Body, Logger, Get } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import * as TelegramBot from 'node-telegram-bot-api';

@Controller('telegram')
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);

  constructor(private readonly telegramService: TelegramService) {}

  @Post('webhook')
  async handleWebhook(@Body() update: TelegramBot.Update) {
    this.logger.log(`Received webhook update: ${JSON.stringify(update)}`);
    await this.telegramService.handleUpdate(update);
    return { status: 'success' };
  }

  @Get('webhook')
  healthCheck() {
    return { status: 'ok', message: 'Webhook is up!' };
  }
}
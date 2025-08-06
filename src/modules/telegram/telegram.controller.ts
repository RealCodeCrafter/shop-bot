import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import * as TelegramBot from 'node-telegram-bot-api';
import { Logger } from '@nestjs/common';

@Controller('telegram')
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);

  constructor(private readonly telegramService: TelegramService) {}

  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(@Body() update: TelegramBot.Update) {
    this.logger.log('Received webhook update');
    await this.telegramService.handleWebhookUpdate(update);
    return {};
  }
}
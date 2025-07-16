import { Controller, Post, Body, Logger, Req } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { ApiTags } from '@nestjs/swagger';
import * as TelegramBot from 'node-telegram-bot-api';
import { Request } from 'express';

@ApiTags('telegram')
@Controller('telegram')
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);

  constructor(private readonly telegramService: TelegramService) {}

  @Post('webhook')
  async handleWebhook(@Body() update: TelegramBot.Update, @Req() request: Request) {
    const startTime = Date.now();
    this.logger.log(`Received webhook update: ${JSON.stringify(update, null, 2)}`);
    this.logger.log(`Request headers: ${JSON.stringify(request.headers, null, 2)}`);
    try {
      await this.telegramService.handleWebhookUpdate(update);
      const duration = Date.now() - startTime;
      this.logger.log(`Webhook processed successfully in ${duration}ms`);
      return { status: 'ok' };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Webhook processing failed after ${duration}ms: ${error.message}`, error.stack);
      throw error;
    }
  }
}
import { Controller, Post, Body, Logger, Req } from '@nestjs/common';
import { Request } from 'express';

@Controller('telegram')
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);

  @Post('webhook')
  async handleWebhook(@Body() update: any, @Req() request: Request) {
    const startTime = Date.now();
    this.logger.log(`Received webhook update: ${JSON.stringify(update, null, 2)}`);
    this.logger.log(`Request headers: ${JSON.stringify(request.headers, null, 2)}`);
    const duration = Date.now() - startTime;
    this.logger.log(`Webhook processed successfully in ${duration}ms`);
    return { status: 'ok' };
  }
}


// import { Controller, Post, Body, Logger, Req } from '@nestjs/common';
// import { TelegramService } from './telegram.service';
// import { ApiTags } from '@nestjs/swagger';
// import { Request } from 'express';

// @ApiTags('telegram')
// @Controller('telegram')
// export class TelegramController {
//   private readonly logger = new Logger(TelegramController.name);

//   constructor(private readonly telegramService: TelegramService) {}

//   @Post('webhook')
//   async handleWebhook(@Body() update: any, @Req() request: Request) {
//     const startTime = Date.now();
//     this.logger.log(`Received webhook update: ${JSON.stringify(update, null, 2)}`);
//     this.logger.log(`Request headers: ${JSON.stringify(request.headers, null, 2)}`);
//     try {
//       await this.telegramService.handleWebhookUpdate(update);
//       const duration = Date.now() - startTime;
//       this.logger.log(`Webhook processed successfully in ${duration}ms`);
//       return { status: 'ok' };
//     } catch (error) {
//       const duration = Date.now() - startTime;
//       this.logger.error(`Webhook processing failed after ${duration}ms: ${error.message}`, error.stack);
//       throw error;
//     }
//   }
// }
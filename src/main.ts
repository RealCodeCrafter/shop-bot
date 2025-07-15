import * as crypto from 'crypto';

if (!(global as any).crypto) {
  (global as any).crypto = crypto;
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/error.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());

  const config = new DocumentBuilder()
    .setTitle('Telegram Shop Bot API')
    .setDescription('API documentation for Telegram Shop Bot')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT || 3000);
  logger.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();

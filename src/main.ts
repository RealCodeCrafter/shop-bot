import * as crypto from 'crypto';
if (!(global as any).crypto) {
  (global as any).crypto = crypto;
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/error.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());

  const PORT = process.env.PORT || 3000;
  await app.listen(PORT, '0.0.0.0');
  logger.log(`Application is running on port: ${PORT}`);
}
bootstrap();

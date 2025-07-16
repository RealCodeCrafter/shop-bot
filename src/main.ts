import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  try {
    const app = await NestFactory.create(AppModule);
    app.enableCors();
    app.getHttpAdapter().get('/health', (req, res) => {
      logger.log('Health check endpoint called');
      res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    const port = 3000; // PORT ni qattiq yozamiz
    await app.listen(port);
    logger.log(`Application is running on port ${port}`);
  } catch (error) {
    logger.error(`Failed to start application: ${error.message}`, error.stack);
    process.exit(1);
  }
}
bootstrap();
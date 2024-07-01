import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  const configService = app.get(ConfigService);
  const corsOptions = {
    origin: '*',
    methods: '*',
  };
  app.enableCors(corsOptions);

  await app.listen(Number(configService.get('PORT')) || 3001);
}
bootstrap();

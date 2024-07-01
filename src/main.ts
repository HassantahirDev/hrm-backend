import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  const PORT = process.env.PORT || 3000; // Use the port provided by Heroku or default to 3000
  await app.listen(PORT);
}
bootstrap(); 

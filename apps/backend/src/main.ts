import morgan from 'morgan';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

  // Enable Morgan logging
  app.use(morgan('combined'));

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    })
  );

  await app.listen(3100, () => {
    console.log('Server is running on http://localhost:3100');
  });
}
bootstrap();

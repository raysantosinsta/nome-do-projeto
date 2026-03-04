/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Necessário para Twilio (x-www-form-urlencoded)
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const port = process.env.PORT || 3000;

  await app.listen(port);

  console.log(`🚀 Server rodando na porta ${port}`);
}
bootstrap();

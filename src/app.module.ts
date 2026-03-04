import { Module } from '@nestjs/common';
import { TwilioController } from './app.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [TwilioController],
})
export class AppModule {}

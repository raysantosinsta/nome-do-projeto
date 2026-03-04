import { Module } from '@nestjs/common';
import { TwilioController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [],
  controllers: [TwilioController],
  providers: [AppService],
})
export class AppModule {}

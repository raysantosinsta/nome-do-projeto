import { Module } from '@nestjs/common';
import { TwilioController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [TwilioController],
  providers: [AppService],
})
export class AppModule {}

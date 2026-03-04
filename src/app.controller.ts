/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Controller, Post, Body, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio';
import axios from 'axios';
import OpenAI from 'openai';

@Controller('webhook/twilio')
export class TwilioController {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.getOrThrow<string>('OPENAI_API_KEY'),
    });
  }

  @Post()
  async receive(@Body() body: any, @Res() res: Response) {
    const twiml = new twilio.twiml.MessagingResponse();

    try {
      if (Number(body.NumMedia) > 0) {
        const mediaUrl = body.MediaUrl0;

        const accountSid =
          this.configService.getOrThrow<string>('TWILIO_ACCOUNT_SID');

        const authToken =
          this.configService.getOrThrow<string>('TWILIO_AUTH_TOKEN');

        const audioResponse = await axios.get(mediaUrl, {
          responseType: 'arraybuffer',
          auth: {
            username: accountSid,
            password: authToken,
          },
        });

        const buffer = Buffer.from(audioResponse.data);

        const transcription = await this.openai.audio.transcriptions.create({
          file: buffer as any,
          model: 'whisper-1',
        });

        twiml.message(`Você disse: ${transcription.text}`);
      } else {
        twiml.message('Envie um áudio 🎤');
      }
    } catch (error) {
      console.error(error);
      twiml.message('Erro ao processar o áudio.');
    }

    res.type('text/xml');
    return res.send(twiml.toString());
  }
}

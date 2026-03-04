/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Controller, Post, Body, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio';
import axios from 'axios';
import OpenAI from 'openai';
import { toFile } from 'openai/uploads';

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
      console.log('Incoming body:', body);

      if (Number(body.NumMedia) > 0) {
        const mediaUrl = body.MediaUrl0;
        const contentType = body.MediaContentType0;

        if (!contentType || !contentType.includes('audio')) {
          twiml.message('Envie apenas áudio 🎤');
          res.type('text/xml');
          return res.send(twiml.toString());
        }

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

        // Detecta extensão automaticamente
        let extension = 'audio.ogg';
        if (contentType.includes('mpeg')) extension = 'audio.mp3';
        if (contentType.includes('mp4')) extension = 'audio.mp4';

        const file = await toFile(buffer, extension);

        const transcription = await this.openai.audio.transcriptions.create({
          file,
          model: 'whisper-1',
        });

        twiml.message(`Você disse: ${transcription.text}`);
      } else {
        twiml.message('Envie um áudio 🎤');
      }
    } catch (error: any) {
      console.error('Erro completo:', error?.response?.data || error);
      twiml.message('Erro ao processar o áudio.');
    }

    res.type('text/xml');
    return res.send(twiml.toString());
  }
}

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Controller, Post, Body, Res } from '@nestjs/common';
import type { Response } from 'express';
import * as twilio from 'twilio';
import axios from 'axios';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

@Controller('webhook/twilio')
export class TwilioController {
  @Post()
  async receive(@Body() body: any, @Res() res: Response) {
    console.log('BODY:', body);

    const twiml = new twilio.twiml.MessagingResponse();

    if (Number(body.NumMedia) > 0) {
      const mediaUrl = body.MediaUrl0;

      // 🔥 Baixar áudio da Twilio
      const audioResponse = await axios.get(mediaUrl, {
        responseType: 'arraybuffer',
        auth: {
          username: process.env.TWILIO_ACCOUNT_SID!,
          password: process.env.TWILIO_AUTH_TOKEN!,
        },
      });

      const buffer = Buffer.from(audioResponse.data);

      // 🔥 Criar arquivo temporário (Node precisa disso)
      const file = new File([buffer], 'audio.ogg');

      const transcription = await openai.audio.transcriptions.create({
        file,
        model: 'whisper-1',
      });

      twiml.message(`Você disse: ${transcription.text}`);
    } else {
      twiml.message('Envie um áudio 🎤');
    }

    res.type('text/xml');
    return res.send(twiml.toString());
  }
}

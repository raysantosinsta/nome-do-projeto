/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Controller, Post, Body, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Controller('webhook/twilio')
export class TwilioController {
  private genAI: GoogleGenerativeAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.getOrThrow<string>('GEMINI_API_KEY');
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  @Post()
  async receive(@Body() body: any, @Res() res: Response) {
    const twiml = new twilio.twiml.MessagingResponse();

    try {
      if (Number(body.NumMedia) > 0) {
        const mediaUrl = body.MediaUrl0;
        const contentType = body.MediaContentType0;

        if (!contentType || !contentType.includes('audio')) {
          twiml.message('Envie apenas áudio 🎤');
          return res.type('text/xml').send(twiml.toString());
        }

        const accountSid =
          this.configService.getOrThrow<string>('TWILIO_ACCOUNT_SID');
        const authToken =
          this.configService.getOrThrow<string>('TWILIO_AUTH_TOKEN');

        // Download do áudio
        const audioResponse = await axios.get(mediaUrl, {
          responseType: 'arraybuffer',
          auth: { username: accountSid, password: authToken },
        });

        const base64Audio = Buffer.from(audioResponse.data).toString('base64');

        // --- LÓGICA DE FALLBACK ---
        // Lista de modelos para testar, do mais leve ao mais potente
        const modelsToTry = [
          'gemini-1.5-flash',
          'gemini-1.5-flash-latest',
          'gemini-1.5-pro',
          'gemini-1.5-pro-latest',
          'gemini-pro-vision', // Modelo mais antigo
        ];

        let transcription = '';
        let success = false;

        for (const modelName of modelsToTry) {
          try {
            console.log(`Tentando modelo: ${modelName}`);
            const model = this.genAI.getGenerativeModel({ model: modelName });

            const result = await model.generateContent([
              {
                inlineData: {
                  mimeType: contentType,
                  data: base64Audio,
                },
              },
              { text: 'Transcreva este áudio em português.' },
            ]);

            transcription = result.response.text();
            console.log(`Sucesso com o modelo: ${modelName}`);
            success = true;
            break; // Sai do loop se funcionar
          } catch (err) {
            console.warn(`Falha no modelo ${modelName}:`, err.message);
            continue; // Tenta o próximo da lista
          }
        }

        if (success) {
          twiml.message(`Você disse: ${transcription}`);
        } else {
          twiml.message(
            'Não consegui processar seu áudio com nenhum modelo Gemini disponível.',
          );
        }
      } else {
        twiml.message('Envie um áudio 🎤');
      }
    } catch (error: any) {
      console.error('Erro Geral:', error);
      twiml.message('Erro inesperado no servidor.');
    }

    res.type('text/xml');
    return res.send(twiml.toString());
  }
}

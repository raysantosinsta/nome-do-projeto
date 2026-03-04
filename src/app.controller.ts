/* eslint-disable @typescript-eslint/require-await */
import { Controller, Post, Body, Res } from '@nestjs/common';
import type { Response } from 'express';
import * as twilio from 'twilio';

@Controller('webhook/twilio')
export class TwilioController {
  @Post()
  async receive(@Body() body: any, @Res() res: Response) {
    console.log('BODY:', body);

    const twiml = new twilio.twiml.MessagingResponse();

    twiml.message('Recebi sua mensagem 🔥');

    res.type('text/xml');
    return res.send(twiml.toString());
  }
}

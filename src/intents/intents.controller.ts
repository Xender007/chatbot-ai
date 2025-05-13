// src/intents/intents.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { ChatbotService } from 'src/chatbot/chatbot.service';


@Controller('chat')
export class IntentsController {
  constructor(private chatbotService: ChatbotService) {}

  @Post()
  async chat(@Body() body: { message: string }) {
    return { reply: await this.chatbotService.getResponse(body.message) };
  }

  // @Get('model-stats')
  // async getStats() {
  //   return this.chatbotService.getModelStats();
  // }
}

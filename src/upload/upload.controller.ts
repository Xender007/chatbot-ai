// src/upload/upload.controller.ts
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChatbotService } from 'src/chatbot/chatbot.service';
import { IntentsService } from 'src/intents/intents.service';

@Controller('chat')
export class UploadController {
  constructor(
    private intentsService: IntentsService,
    private chatbotService: ChatbotService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async upload(@UploadedFile() file: any) {
    // Or install @types/express and use correct type
    if (!file || file.mimetype !== 'application/json') {
      throw new BadRequestException('Invalid file type');
    }

    const content = file.buffer.toString();
    try {
      const data = JSON.parse(content);
      if (
        !Array.isArray(data) ||
        !data.every(
          (i) =>
            i.intent && Array.isArray(i.patterns) && Array.isArray(i.responses),
        )
      ) {
        throw new Error();
      }

      await this.intentsService.replaceIntents(data);
      await this.chatbotService.trainModel(true);
      return { message: 'Model trained successfully' };
    } catch {
      throw new BadRequestException('Invalid data format');
    }
  }

  @Post('intents')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async uploadIntents(@Body() data: any) {
    if (
      !Array.isArray(data) ||
      !data.every(
        (i) =>
          typeof i.intent === 'string' &&
          Array.isArray(i.patterns) &&
          Array.isArray(i.responses),
      )
    ) {
      throw new BadRequestException('Invalid format');
    }

    await this.intentsService.replaceIntents(data);
    await this.chatbotService.trainModel(true);

    return {
      message: 'Intents uploaded and model trained successfully',
      count: data.length,
    };
  }
}

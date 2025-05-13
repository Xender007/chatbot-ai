import { Module } from '@nestjs/common';
import { UploadController } from './upload/upload.controller';
import { IntentsController } from './intents/intents.controller';
import { IntentsService } from './intents/intents.service';
import { ChatbotService } from './chatbot/chatbot.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Intent, IntentSchema } from './intents/intent.schema';
import { MetaService } from './meta/meta.service';
import { Meta, MetaSchema } from './meta/meta.schema';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost/'),
    MongooseModule.forFeature([
      { name: Intent.name, schema: IntentSchema },
      { name: Meta.name, schema: MetaSchema },
    ]),
  ],
  controllers: [IntentsController, UploadController],
  providers: [IntentsService, ChatbotService, MetaService],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { IntentsService } from './intents.service';
import { IntentsController } from './intents.controller';

@Module({
  providers: [IntentsService],
  controllers: [IntentsController],
  exports: [IntentsService],
})
export class IntentsModule {}

// src/intents/intents.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Intent } from './intent.schema';


@Injectable()
export class IntentsService {
  constructor(@InjectModel(Intent.name) private intentModel: Model<Intent>) {}

  async findAll(): Promise<Intent[]> {
    return this.intentModel.find();
  }

  async findByIntent(intent: string): Promise<Intent | null> {
    return this.intentModel.findOne({ intent });
  }

  async replaceIntents(newIntents: Intent[]) {
    await this.intentModel.deleteMany({});
    await this.intentModel.insertMany(newIntents);
  }
}

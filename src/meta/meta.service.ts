// src/intents/meta.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Meta } from './meta.schema';


@Injectable()
export class MetaService {
  constructor(@InjectModel(Meta.name) private metaModel: Model<Meta>) {}

  async getValue(key: string): Promise<string | null> {
    const doc = await this.metaModel.findOne({ key });
    return doc?.value || null;
  }

  async setValue(key: string, value: string) {
    await this.metaModel.updateOne({ key }, { value }, { upsert: true });
  }
}

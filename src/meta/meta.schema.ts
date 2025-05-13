// src/intents/schemas/meta.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'meta' })
export class Meta extends Document {
  @Prop({ required: true }) key: string;
  @Prop({ required: true }) value: string;
}

export const MetaSchema = SchemaFactory.createForClass(Meta);

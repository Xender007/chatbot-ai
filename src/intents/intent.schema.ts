// src/intents/schemas/intent.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Intent extends Document {
  @Prop() intent: string;
  @Prop([String]) patterns: string[];
  @Prop([String]) responses: string[];
}

export const IntentSchema = SchemaFactory.createForClass(Intent);

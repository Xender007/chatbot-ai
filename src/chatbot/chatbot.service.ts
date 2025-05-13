import { Injectable, OnModuleInit } from '@nestjs/common';
import * as tf from '@tensorflow/tfjs';
import * as natural from 'natural';
import * as crypto from 'crypto-js';
import { IntentsService } from '../intents/intents.service';
import { MetaService } from 'src/meta/meta.service';

@Injectable()
export class ChatbotService implements OnModuleInit {
  private tokenizer = new natural.WordTokenizer();
  private model: tf.Sequential;
  private vocabMap: Record<string, number> = {};
  private labelMap: Record<string, number> = {};
  private indexToIntent: Record<number, string> = {};
  private MAX_SEQUENCE_LENGTH = 20;

  constructor(
    private readonly intentsService: IntentsService,
    private readonly metaService: MetaService
  ) {}

  async onModuleInit() {
    const savedHash = await this.metaService.getValue('model_hash');
    if (savedHash) {
      console.log('🧠 Existing model hash found. Attempting to restore model...');
      await this.trainModel(false);
    }
  }

  private hashIntents(intents: any[]): string {
    const sorted = intents.sort((a, b) => a.intent.localeCompare(b.intent));
    const json = JSON.stringify(sorted);
    return crypto.SHA256(json).toString(crypto.enc.Base64);
  }

  async trainModel(force = false) {
    const intents = await this.intentsService.findAll();
    const currentHash = this.hashIntents(intents);
    const savedHash = await this.metaService.getValue('model_hash');

    if (!force && savedHash === currentHash) {
      console.log('✅ Intents unchanged. Skipping retraining.');
      return;
    }

    if (intents.length < 2) {
      throw new Error('At least two intents are required for training.');
    }

    // Tokenize and encode all patterns
    const allTokenizedPatterns: string[][] = [];
    const labels: number[] = [];
    this.labelMap = {};
    let labelIndex = 0;

    for (const intent of intents) {
      if (!(intent.intent in this.labelMap)) {
        this.labelMap[intent.intent] = labelIndex++;
      }
      for (const pattern of intent.patterns) {
        const tokens = this.tokenizer.tokenize(pattern.toLowerCase());
        allTokenizedPatterns.push(tokens);
        labels.push(this.labelMap[intent.intent]);
      }
    }

    const vocabSet = new Set<string>();
    allTokenizedPatterns.flat().forEach((token) => vocabSet.add(token));
    this.vocabMap = {};
    Array.from(vocabSet).forEach((word, idx) => {
      this.vocabMap[word] = idx + 1;
    });

    this.MAX_SEQUENCE_LENGTH = Math.max(
      5,
      Math.min(
        30,
        Math.floor(
          allTokenizedPatterns.reduce((sum, arr) => sum + arr.length, 0) /
            allTokenizedPatterns.length
        )
      )
    );

    this.indexToIntent = Object.entries(this.labelMap).reduce(
      (acc, [key, idx]) => {
        acc[idx] = key;
        return acc;
      },
      {} as Record<number, string>
    );

    const inputData = allTokenizedPatterns.map((tokens) => this.textToTensorFromTokens(tokens));
    const inputs = tf.tensor2d(inputData);
    const outputs = tf.oneHot(tf.tensor1d(labels, 'int32'), Object.keys(this.labelMap).length);

    // Build and compile the model
    this.model = tf.sequential();
    this.model.add(
      tf.layers.embedding({
        inputDim: vocabSet.size + 1,
        outputDim: 32,
        inputLength: this.MAX_SEQUENCE_LENGTH,
      })
    );
    this.model.add(tf.layers.globalAveragePooling1d());
    this.model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
    this.model.add(
      tf.layers.dense({ units: Object.keys(this.labelMap).length, activation: 'softmax' })
    );

    this.model.compile({
      optimizer: 'adam',
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy'],
    });

    console.log(
      `🧠 Training on ${inputData.length} samples. Vocab size: ${vocabSet.size}. Sequence length: ${this.MAX_SEQUENCE_LENGTH}`
    );
    await this.model.fit(inputs, outputs, {
      epochs: 200,
      batchSize: 32,
      shuffle: true,
      verbose: 1,
    });

    await this.metaService.setValue('model_hash', currentHash);
    console.log('✅ Model trained and hash saved.');
  }

  private textToTensorFromTokens(tokens: string[]): number[] {
    const encoded = tokens.map((token) => this.vocabMap[token] || 0);
    const padded = Array(this.MAX_SEQUENCE_LENGTH).fill(0);
    for (let i = 0; i < Math.min(encoded.length, this.MAX_SEQUENCE_LENGTH); i++) {
      padded[i] = encoded[i];
    }
    return padded;
  }

  private textToTensor(text: string): number[] {
    const tokens = this.tokenizer.tokenize(text.toLowerCase());
    return this.textToTensorFromTokens(tokens);
  }

  async getResponse(message: string): Promise<string> {
    if (!this.model) {
      try {
        await this.trainModel(true);
      } catch (err) {
        console.error('❌ Model training failed:', err);
        return 'Model initialization failed.';
      }
    }

    const input = tf.tensor2d([this.textToTensor(message)]);
    const prediction = this.model.predict(input) as tf.Tensor;
    const predictionArray = prediction.dataSync();
    const predictedIndex = prediction.argMax(1).dataSync()[0];
    const confidence = predictionArray[predictedIndex];

    const CONFIDENCE_THRESHOLD = 0.4;
    if (confidence < CONFIDENCE_THRESHOLD) {
      return "Sorry, I didn't understand.";
    }

    const intentKey = this.indexToIntent[predictedIndex];
    const intent = await this.intentsService.findByIntent(intentKey);
    if (!intent || !intent.responses?.length) {
      return "Sorry, I didn't understand.";
    }

    const response = intent.responses[Math.floor(Math.random() * intent.responses.length)];
    return response;
  }
}

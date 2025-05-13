import { Test, TestingModule } from '@nestjs/testing';
import { IntentsService } from './intents.service';

describe('IntentsService', () => {
  let service: IntentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IntentsService],
    }).compile();

    service = module.get<IntentsService>(IntentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

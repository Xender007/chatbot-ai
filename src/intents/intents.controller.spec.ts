import { Test, TestingModule } from '@nestjs/testing';
import { IntentsController } from './intents.controller';

describe('IntentsController', () => {
  let controller: IntentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IntentsController],
    }).compile();

    controller = module.get<IntentsController>(IntentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { RootController } from './root.controller';
import { RootService } from './root.service';

describe('RootController', () => {
  let rootController: RootController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      controllers: [RootController],
      providers: [RootService],
    }).compile();

    rootController = app.get<RootController>(RootController);
  });

  describe('root', () => {
    it('should return "OK"', () => {
      expect(rootController.getStatus()).toBe('OK');
    });
  });

  describe('config', () => {
    it('should return basic config object', () => {
      expect(rootController.getConfig()).toEqual({});
    });
  });
});

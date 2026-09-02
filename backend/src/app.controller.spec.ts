import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('ping', () => {
    it('deve retornar status ok no ping', () => {
      const result = appController.ping();
      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('message');
    });
  });
});

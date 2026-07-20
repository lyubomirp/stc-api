import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from '../controllers/app.controller';

describe('AppController', () => {
  let app: TestingModule;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();
  });

  describe('health', () => {
    it('reports ok', () => {
      const controller = app.get(AppController);
      expect(controller.health()).toEqual({ status: 'ok' });
    });
  });
});

import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppController } from './app.controller.js';
import { GraphService } from './graph/graph.service.js';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const graphService = {
      isLoaded: () => true,
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: GraphService, useValue: graphService }],
    }).compile();

    appController = moduleRef.get(AppController);
  });

  describe('health', () => {
    it('reports ok when the graph is loaded', () => {
      expect(appController.health()).toEqual({
        status: 'ok',
        graphLoaded: true,
      });
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';

describe('Routing backend (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.body.graphLoaded).toBe(true);
        expect(res.body.status).toBe('ok');
      });
  });

  it('GET /graph/info', () => {
    return request(app.getHttpServer())
      .get('/graph/info')
      .expect(200)
      .expect((res) => {
        expect(res.body.nodeCount).toBeGreaterThan(1000);
        expect(res.body.edgeCount).toBeGreaterThan(1000);
        expect(res.body.attribution).toContain('OpenStreetMap');
      });
  });

  it('POST /route returns a path inside Noida', () => {
    return request(app.getHttpServer())
      .post('/route')
      .send({
        sourceLat: 28.5703,
        sourceLon: 77.3219,
        destLat: 28.5355,
        destLon: 77.3910,
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.distanceM).toBeGreaterThan(0);
        expect(res.body.coordinates.length).toBeGreaterThan(1);
        expect(res.body.stats.nodesExplored).toBeGreaterThan(0);
        expect(res.body.stats.edgesEvaluated).toBeGreaterThan(0);
      });
  });
});

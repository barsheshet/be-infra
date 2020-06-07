import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('API root (e2e)', () => {
  let app: INestApplication;
  let server;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET)', async () => {
    const response = await request(server).get('/');

    expect(response.status).toBe(200);
    expect(response.text).toBe('OK');
  });

  it('/config (GET)', async () => {
    const response = await request(server).get('/getConfig');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      host: 'http://localhost:3000',
      environment: 'test',
      port: 3000,
    });
  });
});

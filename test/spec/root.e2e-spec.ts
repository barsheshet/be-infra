import { mockServer } from '../mock-server';
import { NestFastifyApplication } from '@nestjs/platform-fastify';

describe('API root (e2e)', () => {
  let server: NestFastifyApplication;

  beforeAll(async () => {
    server = await mockServer();
  });

  afterAll(async () => {
    await server.close();
  });

  it('/ (GET)', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/',
    });

    expect(response.payload).toBe('OK');
  });

  it('/config (GET)', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/getConfig',
    });

    expect(JSON.parse(response.payload)).toEqual({
      host: 'http://localhost:3000',
      environment: 'test',
      port: 3000,
    });
  });
});
